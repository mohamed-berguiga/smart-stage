import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/dashboard-ui";
import type { Task, TaskStatus } from "@/lib/demo-data";

type ColumnKey = TaskStatus;

const columns: { key: ColumnKey; label: string; accent: string; droppable: boolean }[] = [
  { key: "A faire", label: "À faire", accent: "bg-muted-foreground/40", droppable: true },
  { key: "En cours", label: "En cours", accent: "bg-warning", droppable: true },
  { key: "Terminée", label: "Terminée", accent: "bg-success", droppable: true },
  { key: "En retard", label: "En retard", accent: "bg-destructive", droppable: false },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function TaskCard({
  task,
  showAssignee,
  draggable,
}: {
  task: Task;
  showAssignee: boolean;
  draggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-sm",
        draggable && "cursor-grab touch-none active:cursor-grabbing",
        isDragging && "z-50 opacity-90 shadow-lg",
      )}
    >
      <p className="text-sm font-medium leading-snug">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        <span className="text-xs text-muted-foreground">{task.deadline}</span>
        {task.type === "Documentation" ? (
          <Paperclip className="size-3.5 text-muted-foreground" aria-label="Pièce jointe" />
        ) : null}
        {showAssignee ? (
          <span
            title={task.assignedTo}
            className="ml-auto inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
          >
            {initials(task.assignedTo)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Column({
  column,
  tasks,
  showAssignee,
  canDrag,
}: {
  column: (typeof columns)[number];
  tasks: Task[];
  showAssignee: boolean;
  canDrag: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key, disabled: !column.droppable });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-[15rem] flex-1 flex-col rounded-xl border border-border bg-muted/40 p-3 transition-colors",
        isOver && column.droppable && "border-primary bg-primary/5",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", column.accent)} />
        <p className="text-sm font-semibold">{column.label}</p>
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            Aucune tâche
          </p>
        ) : null}
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} showAssignee={showAssignee} draggable={canDrag} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  showAssignee,
  canDrag,
  onStatusChange,
}: {
  tasks: Task[];
  showAssignee: boolean;
  canDrag: boolean;
  // Accepte maintenant un appel asynchrone (vrai appel réseau vers le backend) :
  // on l'attend pour savoir s'il faut confirmer ou annuler la carte déplacée.
  onStatusChange: (id: string, status: TaskStatus) => void | Promise<void>;
}) {
  const [pending, setPending] = useState<Record<string, TaskStatus>>({});
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );

  const effective = (t: Task) => pending[t.id] ?? t.status;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const target = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || target === "En retard") return;
    const from = effective(task);
    if (from === target) return;

    // Mise à jour optimiste immédiate, puis persistance en arrière-plan ;
    // en cas d'échec (réseau, backend) on remet la carte à sa place d'origine.
    setPending((p) => ({ ...p, [task.id]: target }));

    void Promise.resolve(onStatusChange(task.id, target))
      .then(() => {
        toast.success(`« ${task.title} » → ${target}`);
        setPending((p) => {
          const next = { ...p };
          delete next[task.id];
          return next;
        });
      })
      .catch(() => {
        setPending((p) => {
          const next = { ...p };
          delete next[task.id];
          return next;
        });
        toast.error("Impossible de mettre à jour le statut, réessayez");
      });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((c) => (
          <Column
            key={c.key}
            column={c}
            tasks={tasks.filter((t) => effective(t) === c.key)}
            showAssignee={showAssignee}
            canDrag={canDrag}
          />
        ))}
      </div>
      {canDrag ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Glissez une carte d'une colonne à l'autre pour changer son statut. La colonne « En retard »
          est calculée automatiquement (lecture seule).
        </p>
      ) : null}
    </DndContext>
  );
}