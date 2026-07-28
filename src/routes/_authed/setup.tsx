import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PrototypeNav } from "@/components/PrototypeNav";

export const Route = createFileRoute("/_authed/setup")({
  head: () => ({
    meta: [
      { title: "Ruta Clara — Tus objetivos" },
      { name: "description", content: "Definí tu ganancia mínima por kilómetro y por hora." },
    ],
  }),
  component: Setup,
});

function Setup() {
  const [perKm, setPerKm] = useState("450");
  const [perHour, setPerHour] = useState("3800");
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md w-full">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full grid place-items-center bg-go/15 border border-go/40">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-go">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3">Listo</h1>
          <p className="text-muted-foreground mb-2">Tus objetivos quedaron guardados.</p>
          <div className="my-8 grid grid-cols-2 gap-3">
            <Stat label="Mínimo $/km" value={perKm} />
            <Stat label="Mínimo $/hora" value={perHour} />
          </div>
          <Link to="/home" className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-6 py-4 text-base font-semibold text-accent-foreground active:scale-[0.98] transition-transform">
            Empezar a trabajar
          </Link>
        </div>
        <PrototypeNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 pb-32">
      <div className="max-w-md mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Paso 1 · Objetivos</p>
        <h1 className="text-3xl font-bold mb-2">¿Cuánto necesitás ganar?</h1>
        <p className="text-muted-foreground mb-8">Poné tus mínimos. Con eso decidimos si un viaje conviene o no.</p>

        <div className="space-y-5">
          <Field label="Ganancia mínima por kilómetro" suffix="$/km" value={perKm} onChange={setPerKm} />
          <Field label="Ganancia mínima por hora" suffix="$/hora" value={perHour} onChange={setPerHour} />
        </div>

        <button
          onClick={() => setSaved(true)}
          className="mt-10 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-accent-foreground active:scale-[0.98] transition-transform"
        >
          Guardar y seguir
        </button>
        <p className="mt-4 text-center text-xs text-muted-foreground">Podés cambiarlos cuando quieras.</p>
      </div>
      <PrototypeNav />
    </div>
  );
}

function Field({ label, suffix, value, onChange }: { label: string; suffix: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-sm text-muted-foreground mb-2">{label}</span>
      <div className="flex items-center rounded-xl border border-border bg-surface px-4 py-4 focus-within:border-accent transition-colors">
        <span className="tabular text-2xl text-muted-foreground mr-2">$</span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          className="tabular flex-1 bg-transparent text-4xl font-bold outline-none min-w-0"
        />
        <span className="text-sm text-muted-foreground shrink-0 ml-2">{suffix}</span>
      </div>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface border border-border p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className="tabular text-2xl font-bold">${value}</div>
    </div>
  );
}
