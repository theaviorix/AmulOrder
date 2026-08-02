export default function StatCard({ label, value, sub, icon: Icon, tone = "default" }) {
  const toneCls =
    tone === "amber" ? "text-[hsl(var(--amber))]"
    : tone === "success" ? "text-[hsl(var(--success))]"
    : tone === "destructive" ? "text-[hsl(var(--destructive))]"
    : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-500 uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && <Icon size={16} className="text-muted-foreground" />}
      </div>
      <p className={`mt-3 font-display text-2xl font-700 ${toneCls}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}