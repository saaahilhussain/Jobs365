import { cn } from "@/lib/utils";

export default function StatCard({ title, value, icon: Icon, subtitle, className }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 flex flex-col gap-1",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      {subtitle && (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      )}
    </div>
  );
}
