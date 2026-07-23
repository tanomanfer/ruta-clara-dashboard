import { createFileRoute, Link } from "@tanstack/react-router";
import { PrototypeNav } from "@/components/PrototypeNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ruta Clara — Bienvenida" },
      { name: "description", content: "Sabé de reojo si el viaje conviene, sin sacar los ojos del camino." },
      { property: "og:title", content: "Ruta Clara" },
      { property: "og:description", content: "Tablero para choferes de Uber/DiDi." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="max-w-md w-full">
        <div className="mx-auto mb-8 h-20 w-20 rounded-2xl border border-border grid place-items-center bg-surface">
          <div className="tabular text-3xl font-extrabold text-accent">RC</div>
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Tablero para choferes</p>
        <h1 className="text-5xl font-bold tracking-tight mb-4">Ruta Clara</h1>
        <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
          Sabé de reojo si el viaje conviene. Sin mirar el celular dos segundos de más.
        </p>
        <Link
          to="/setup"
          className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-6 py-4 text-base font-semibold text-accent-foreground transition-transform active:scale-[0.98]"
        >
          Empezar
        </Link>
        <p className="mt-6 text-xs text-muted-foreground">
          Solo prototipo visual · Datos de ejemplo
        </p>
      </div>
      <PrototypeNav />
    </div>
  );
}
