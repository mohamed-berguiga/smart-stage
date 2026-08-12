import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Task, type TaskPriority, type TaskStatus } from "@/lib/demo-data";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";

export type Account = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "rh" | "encadrant" | "stagiaire";
  department: string;
  supervisor?: string | undefined;
  phone?: string | undefined;
  active: boolean;
  startDate?: string | undefined;
  endDate?: string | undefined;
};

export type NewAccountInput = Omit<Account, "id" | "active" | "supervisor"> & {
  password: string;
  /** Id MongoDB réel de l'encadrant choisi (stagiaires uniquement), pour créer l'affectation Stage. */
  encadrantId?: string | undefined;
};

/* ====================================================================== */
/*  Tâches — mapping entre le format de l'API et le format d'affichage    */
/* ====================================================================== */

function apiStatusToUi(status: string, isLate: boolean): TaskStatus {
  if (isLate) return "En retard";
  if (status === "À faire") return "A faire";
  return status as TaskStatus;
}

function uiStatusToApi(status: TaskStatus): "À faire" | "En cours" | "Terminée" {
  if (status === "A faire") return "À faire";
  if (status === "En retard") return "Terminée"; // garde-fou : ne devrait jamais être envoyé
  return status;
}

function formatDeadline(dueDate?: string | null): string {
  if (!dueDate) return "à définir";
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return "à définir";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiTask(t: any): Task {
  return {
    id: t._id,
    title: t.title,
    type: t.type,
    priority: t.priority,
    status: apiStatusToUi(t.status, !!t.isLate),
    deadline: formatDeadline(t.dueDate),
    assignedTo: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : "",
    createdBy: t.creator ? `${t.creator.firstName} ${t.creator.lastName}` : "",
    createdAt: t.createdAt,
    isPersonal: !!t.isPersonal,
  };
}

export type NewTaskInput = {
  title: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | undefined;
  assignedToId: string;
  isPersonal?: boolean | undefined;
};

export type TaskPatchInput = {
  title?: string | undefined;
  type?: string | undefined;
  priority?: TaskPriority | undefined;
  status?: TaskStatus | undefined;
  dueDate?: string | undefined;
};

type Store = {
  accounts: Account[];
  accountsLoading: boolean;
  departments: { id: string; name: string }[];
  tasks: Task[];
  tasksLoading: boolean;
  myStagiaires: { id: string; name: string }[];
  fullName: (a: Account) => string;
  addAccount: (a: NewAccountInput) => Promise<void>;
  addAccounts: (list: NewAccountInput[]) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  toggleAccount: (id: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  addTask: (t: NewTaskInput) => Promise<void>;
  updateTask: (id: string, patch: TaskPatchInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, role } = useSession();

  // ---- Comptes & départements : branchés sur la vraie API (RH uniquement) ----
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  const fullName = useCallback((a: Account) => `${a.firstName} ${a.lastName}`.trim(), []);

  const refreshDepartments = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await api.get<any[]>("/departments");
      setDepartments(data.map((d: any) => ({ id: d._id, name: d.name })));
    } catch (err) {
      console.error("Erreur lors du chargement des départements :", err);
    }
  }, []);

  const refreshAccounts = useCallback(async () => {
    if (role !== "RH") {
      setAccounts([]);
      setAccountsLoading(false);
      return;
    }
    try {
      const [users, stages] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        api.get<any[]>("/users"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        api.get<any[]>("/stages"),
      ]);
      const stageByStagiaire = new Map<string, { supervisor: string; department: string }>();
      stages.forEach((s) => {
        if (s.stagiaire?._id) {
          stageByStagiaire.set(s.stagiaire._id, {
            supervisor: `${s.encadrant.firstName} ${s.encadrant.lastName}`,
            department: s.department?.name ?? "",
          });
        }
      });
      const mapped: Account[] = users
        .filter((u) => u.role !== "RH")
        .map((u) => {
          const stageInfo = stageByStagiaire.get(u._id);
          return {
            id: u._id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            role: u.role === "ENCADRANT" ? ("encadrant" as const) : ("stagiaire" as const),
            department: stageInfo?.department ?? u.department?.name ?? "",
            supervisor: stageInfo?.supervisor,
            phone: u.phone,
            active: !!u.status,
            startDate: u.startDate,
            endDate: u.endDate,
          };
        });
      setAccounts(mapped);
    } catch (err) {
      console.error("Erreur lors du chargement des comptes :", err);
    } finally {
      setAccountsLoading(false);
    }
  }, [role]);

  const addAccount = useCallback(
    async (a: NewAccountInput) => {
      const departmentId = departments.find((d) => d.name === a.department)?.id;
      const created = await api.post<{ _id: string }>("/users", {
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        password: a.password,
        phone: a.phone,
        role: a.role.toUpperCase(),
        department: departmentId,
        startDate: a.startDate,
        endDate: a.endDate,
      });

      if (a.role === "stagiaire" && a.encadrantId && departmentId && a.startDate && a.endDate) {
        await api.post("/stages", {
          stagiaire: created._id,
          encadrant: a.encadrantId,
          department: departmentId,
          startDate: a.startDate,
          endDate: a.endDate,
        });
      } else if (a.role === "stagiaire") {
        const missing = [
          !a.encadrantId && "encadrant",
          !departmentId && "département",
          !a.startDate && "date de début",
          !a.endDate && "date de fin",
        ].filter(Boolean);
        console.warn(`Stagiaire créé sans affectation Stage — manquant : ${missing.join(", ")}.`);
      }
      await refreshAccounts();
    },
    [departments, refreshAccounts],
  );

  const addAccounts = useCallback(
    async (list: NewAccountInput[]) => {
      for (const a of list) {
        // eslint-disable-next-line no-await-in-loop
        await addAccount(a);
      }
    },
    [addAccount],
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      await api.delete(`/users/${id}`);
      await refreshAccounts();
    },
    [refreshAccounts],
  );

  const toggleAccount = useCallback(
    async (id: string) => {
      await api.patch(`/users/${id}/status`);
      await refreshAccounts();
    },
    [refreshAccounts],
  );

  // ---- Tâches : branchées sur la vraie API ----
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [myStagiaires, setMyStagiaires] = useState<{ id: string; name: string }[]>([]);

  const refreshTasks = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await api.get<any[]>("/tasks");
      setTasks(data.map(mapApiTask));
    } catch (err) {
      console.error("Erreur lors du chargement des tâches :", err);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const refreshMyStagiaires = useCallback(async () => {
    if (role !== "ENCADRANT") return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await api.get<any[]>("/users/my-stagiaires");
      setMyStagiaires(
        data.filter(Boolean).map((s) => ({ id: s._id, name: `${s.firstName} ${s.lastName}` })),
      );
    } catch (err) {
      console.error("Erreur lors du chargement des stagiaires :", err);
    }
  }, [role]);

  useEffect(() => {
    if (!user) return;
    void refreshTasks();
    void refreshMyStagiaires();
    void refreshAccounts();
    void refreshDepartments();
  }, [user, refreshTasks, refreshMyStagiaires, refreshAccounts, refreshDepartments]);

  // Pas de WebSocket dans ce projet : on simule un semblant de "temps réel"
  // en rafraîchissant les tâches en arrière-plan. Un encadrant qui crée une
  // tâche verra son apparition chez le stagiaire sans que celui-ci n'ait
  // besoin d'appuyer sur F5, avec un délai de quelques secondes maximum.
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      void refreshTasks();
    }, 15000);
    return () => clearInterval(interval);
  }, [user, refreshTasks]);

  const addTask = useCallback(
    async (input: NewTaskInput) => {
      await api.post("/tasks", {
        title: input.title,
        type: input.type,
        priority: input.priority,
        status: uiStatusToApi(input.status),
        dueDate: input.dueDate,
        assignedTo: input.assignedToId,
        isPersonal: !!input.isPersonal,
      });
      await refreshTasks();
    },
    [refreshTasks],
  );

  const updateTask = useCallback(
    async (id: string, patch: TaskPatchInput) => {
      const { status, ...rest } = patch;
      if (Object.keys(rest).length > 0) {
        await api.put(`/tasks/${id}`, rest);
      }
      if (status !== undefined) {
        await api.patch(`/tasks/${id}/status`, { status: uiStatusToApi(status) });
      }
      await refreshTasks();
    },
    [refreshTasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await api.delete(`/tasks/${id}`);
      await refreshTasks();
    },
    [refreshTasks],
  );

  const value = useMemo<Store>(
    () => ({
      accounts,
      accountsLoading,
      departments,
      tasks,
      tasksLoading,
      myStagiaires,
      fullName,
      addAccount,
      addAccounts,
      deleteAccount,
      toggleAccount,
      refreshAccounts,
      addTask,
      updateTask,
      deleteTask,
      refreshTasks,
    }),
    [
      accounts,
      accountsLoading,
      departments,
      tasks,
      tasksLoading,
      myStagiaires,
      fullName,
      addAccount,
      addAccounts,
      deleteAccount,
      toggleAccount,
      refreshAccounts,
      addTask,
      updateTask,
      deleteTask,
      refreshTasks,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore doit être utilisé dans AppDataProvider");
  return ctx;
}

export const priorities: TaskPriority[] = ["Faible", "Moyenne", "Haute", "Urgente"];
export const taskStatuses: TaskStatus[] = ["A faire", "En cours", "Terminée", "En retard"];
export const taskTypes = [
  "Développement",
  "Documentation",
  "Correction",
  "Réunion",
  "Recherche",
  "Formation",
];