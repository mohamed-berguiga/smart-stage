import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/lib/demo-data";

export function StatCard({
  label,
  value,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  }[tone];

  return (
    <div className="surface-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface-card p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, string> = {
    "A faire": "bg-muted text-muted-foreground",
    "En cours": "bg-warning/15 text-warning-foreground",
    "Terminée": "bg-success/15 text-success",
    "En retard": "bg-destructive/15 text-destructive",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", map[status])}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const map: Record<TaskPriority, string> = {
    Faible: "border-border text-muted-foreground",
    Moyenne: "border-primary/30 text-primary",
    Haute: "border-warning/50 text-warning-foreground",
    Urgente: "border-destructive/50 text-destructive",
  };
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-medium", map[priority])}>
      {priority}
    </span>
  );
}

export function BarRow({
  label,
  value,
  max,
  tone = "primary",
}: {
  label: string;
  value: number;
  max: number;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const bar = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
  }[tone];

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 truncate text-muted-foreground">{label}</span>
      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className={cn("block h-full rounded-full", bar)}
          style={{ width: `${Math.round((value / max) * 100)}%` }}
        />
      </span>
      <span className="w-10 shrink-0 text-right font-semibold tabular-nums">{value}</span>
    </div>
  );
}
