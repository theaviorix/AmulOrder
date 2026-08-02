import { Link } from "react-router-dom";

export default function Logo({ tone = "dark", className = "" }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <span className="font-display text-[15px] font-700 leading-none">A</span>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[hsl(var(--amber))]" />
      </span>
      <span className={`font-display text-[17px] font-600 tracking-tight ${tone === "light" ? "text-white" : "text-foreground"}`}>
        Amul<span className="text-[hsl(var(--amber))]"> Connect</span>
      </span>
    </Link>
  );
}