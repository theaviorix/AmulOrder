const ORDER = {
  placed: "bg-accent text-muted-foreground",
  accepted: "bg-[hsl(var(--amber))]/12 text-[hsl(var(--amber))]",
  dispatched: "bg-[hsl(var(--success))]/12 text-[hsl(var(--success))]",
  billed: "bg-primary text-primary-foreground",
  rejected: "bg-[hsl(var(--destructive))]/12 text-[hsl(var(--destructive))]",
  adjusted: "bg-[hsl(var(--amber))]/12 text-[hsl(var(--amber))]",
};
const LINK = {
  pending: "bg-[hsl(var(--amber))]/12 text-[hsl(var(--amber))]",
  active: "bg-[hsl(var(--success))]/12 text-[hsl(var(--success))]",
  blocked: "bg-[hsl(var(--destructive))]/12 text-[hsl(var(--destructive))]",
};
export default function StatusBadge({ status, kind = "order", className = "" }) {
  const map = kind === "link" ? LINK : ORDER;
  const cls = map[status] || "bg-accent text-muted-foreground";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-600 capitalize ${cls} ${className}`}>
      {label}
    </span>
  );
}