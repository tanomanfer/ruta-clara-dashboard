import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const screens = [
  { to: "/", label: "Bienvenida" },
  { to: "/setup", label: "Objetivos" },
  { to: "/home", label: "Home" },
  { to: "/trip-tablet", label: "Tablet" },
  { to: "/trip-mobile", label: "Mobile" },
  { to: "/history", label: "Historial" },
  { to: "/empty", label: "Vacío" },
] as const;

export function PrototypeNav() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      {open && (
        <div className="mb-2 rounded-2xl border border-border bg-surface/95 backdrop-blur p-2 shadow-2xl grid grid-cols-2 gap-1 min-w-[260px]">
          {screens.map((s) => {
            const active = pathname === s.to;
            return (
              <Link
                key={s.to}
                to={s.to}
                onClick={() => setOpen(false)}
                className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
          {isAuthenticated ? (
            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
                navigate({ to: "/" });
              }}
              className="px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors text-destructive hover:bg-surface-2"
            >
              Cerrar sesión
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="mx-auto flex items-center gap-2 rounded-full border border-border bg-surface/95 backdrop-blur px-4 py-2 text-xs font-medium text-muted-foreground shadow-xl hover:text-foreground"
      >
        <span className="h-2 w-2 rounded-full bg-accent" />
        Prototipo · {screens.find((s) => s.to === pathname)?.label ?? "—"}
      </button>
    </div>
  );
}
