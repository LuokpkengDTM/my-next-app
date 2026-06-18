import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { PatientStatus } from "@/lib/mock-data";
import { useT } from "@/lib/settings-context";

export function StatusBadge({ status, className }: { status: PatientStatus; className?: string }) {
  const t = useT();
  if (status === "risk") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold select-none",
          "bg-red-50/90 border-red-200 text-red-700",
          "dark:bg-red-950/30 dark:border-red-900/60 dark:text-red-400",
          className,
        )}
        role="status"
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{t("status.risk")}</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold select-none",
        "bg-green-50/90 border-green-200 text-green-700",
        "dark:bg-green-950/20 dark:border-green-900/60 dark:text-green-400",
        className,
      )}
      role="status"
    >
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{t("status.normal")}</span>
    </span>
  );
}
