import type { ReactNode } from "react";

type StatusBadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

const variantClasses: Record<StatusBadgeVariant, string> = {
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  error: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  info: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  neutral: "border-white/15 bg-white/[0.08] text-slate-200",
};

export function StatusBadge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: StatusBadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
