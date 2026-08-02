import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, ChevronRight } from "lucide-react";
import Logo from "@/components/landing/Logo";
import NotificationBell from "@/components/NotificationBell";
import { clearSession, getSession } from "@/lib/session";

export default function DashboardShell({ items, roleLabel, targetId, notifType, accent }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();

  const logout = () => {
    clearSession();
    navigate("/");
  };

  const NavList = () => (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((it) => {
        const active = location.pathname === it.path;
        return (
          <Link
            key={it.path}
            to={it.path}
            onClick={() => setOpen(false)}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-500 transition-colors ${
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <it.icon size={18} />
            <span>{it.label}</span>
            {active && <ChevronRight size={15} className="ml-auto" />}
          </Link>
        );
      })}
    </nav>
  );

  const BrandRow = () => (
    <div className="flex h-16 items-center justify-between border-b border-border px-5">
      <Logo />
      <button className="lg:hidden" onClick={() => setOpen(false)}>
        <X size={20} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-border bg-card lg:flex">
        <BrandRow />
        <div className="px-5 py-4">
          <p className="text-[11px] font-600 uppercase tracking-widest text-muted-foreground">{roleLabel}</p>
          <p className="mt-0.5 truncate text-sm font-600">{session?.name || "—"}</p>
        </div>
        <NavList />
        <div className="border-t border-border p-3">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-500 text-muted-foreground hover:bg-accent hover:text-foreground">
            <LogOut size={18} /> Switch role
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-card">
            <BrandRow />
            <NavList />
            <div className="border-t border-border p-3">
              <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-500 text-muted-foreground hover:bg-accent">
                <LogOut size={18} /> Switch role
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-56">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-[hsl(var(--background))]/85 px-5 backdrop-blur-xl">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <NotificationBell targetId={targetId} type={notifType} />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-600 text-primary-foreground">
              {(session?.name || "?").charAt(0)}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}