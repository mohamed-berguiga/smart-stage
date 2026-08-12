import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

type ApiNotification = {
  _id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

function frDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api.get<ApiNotification[]>("/notifications");
      setNotifications(data);
    } catch {
      // Silencieux : on ne veut pas spammer de toast d'erreur en tâche de fond.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // Rafraîchissement léger toutes les 30s pour garder le compteur à jour.
    const interval = setInterval(() => void refresh(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void refresh();
        }}
        className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border p-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                className="text-xs font-medium text-primary hover:underline"
              >
                Tout marquer comme lu
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="p-3 text-sm text-muted-foreground">Chargement…</p>
            ) : notifications.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">Aucune notification.</p>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li
                    key={n._id}
                    className={`border-b border-border/60 p-3 text-sm last:border-0 ${
                      n.isRead ? "" : "bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={n.isRead ? "text-muted-foreground" : "font-medium"}>{n.message}</p>
                      {!n.isRead ? (
                        <button
                          type="button"
                          onClick={() => void markAsRead(n._id)}
                          className="shrink-0 text-xs font-medium text-primary hover:underline"
                        >
                          Lu
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{frDateTime(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}