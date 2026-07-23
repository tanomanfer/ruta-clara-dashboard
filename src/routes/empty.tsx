import { createFileRoute, Link } from "@tanstack/react-router";
import { PrototypeNav } from "@/components/PrototypeNav";

export const Route = createFileRoute("/empty")({
  head: () => ({
    meta: [
      { title: "Ruta Clara — Sin viajes todavía" },
      { name: "description", content: "Estado inicial antes del primer viaje." },
    ],
  }),
  component: Empty,
});

function Empty() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center pb-32">
      <div className="max-w-sm w-full">
        {/* Speedometer icon */}
        <div className="mx-auto mb-8 h-28 w-28 rounded-full border-2 border-border bg-surface grid place-items-center relative">
          <div className="absolute inset-3 rounded-full border border-border/60" />
          <svg viewBox="0 0 100 100" className="h-20 w-20">
            <path d="M 20 70 A 35 35 0 0 1 80 70" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" strokeLinecap="round" />
            <path d="M 20 70 A 35 35 0 0 1 50 35" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent" strokeLinecap="round" />
            <line x1="50" y1="70" x2="38" y2="45" stroke="currentColor" strokeWidth="3" className="text-accent" strokeLinecap="round" />
            <circle cx="50" cy="70" r="4" fill="currentColor" className="text-accent" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-3">Todavía no hay viajes</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          En cuanto actives el monitoreo, vas a ver acá tu rendimiento del día: $/km, $/hora y qué viajes valió la pena tomar.
        </p>

        <Link
          to="/home"
          className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-6 py-4 text-base font-semibold text-accent-foreground active:scale-[0.98] transition-transform"
        >
          Empezar a monitorear
        </Link>
      </div>
      <PrototypeNav />
    </div>
  );
}
