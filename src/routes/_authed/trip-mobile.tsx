import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PrototypeNav } from "@/components/PrototypeNav";

type Tone = "go" | "warn" | "stop";
const scenarios: Record<Tone, { label: string; value: string; unit: string; msg: string }> = {
  go: { label: "Conviene", value: "720", unit: "$/km", msg: "Buen viaje" },
  warn: { label: "Dudoso", value: "480", unit: "$/km", msg: "Justo en el límite" },
  stop: { label: "No conviene", value: "290", unit: "$/km", msg: "Muy por debajo" },
};

export const Route = createFileRoute("/_authed/trip-mobile")({
  head: () => ({
    meta: [
      { title: "Ruta Clara — Vista celular" },
      { name: "description", content: "Franja superior que nunca tapa lo que estás mirando." },
    ],
  }),
  component: TripMobile,
});

function TripMobile() {
  const [tone, setTone] = useState<Tone>("go");
  const s = scenarios[tone];

  const toneBg = tone === "go" ? "bg-go" : tone === "warn" ? "bg-warn" : "bg-stop";
  const toneText = tone === "go" ? "text-go" : tone === "warn" ? "text-warn" : "text-stop";
  const toneBorder = tone === "go" ? "border-go/40" : tone === "warn" ? "border-warn/40" : "border-stop/40";
  const toneTint = tone === "go" ? "bg-go/10" : tone === "warn" ? "bg-warn/10" : "bg-stop/10";

  return (
    <div className="min-h-screen py-8 px-4 pb-32">
      {/* Scenario switcher */}
      <div className="max-w-xs mx-auto mb-6 grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1">
        {(["go", "warn", "stop"] as Tone[]).map((t) => (
          <button
            key={t}
            onClick={() => setTone(t)}
            className={`py-2 rounded-lg text-xs font-medium transition-colors ${tone === t ? "bg-surface-2 text-foreground" : "text-muted-foreground"}`}
          >
            {t === "go" ? "Verde" : t === "warn" ? "Ámbar" : "Rojo"}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div className="mx-auto w-[300px] rounded-[42px] border-[10px] border-black bg-black overflow-hidden shadow-2xl">
        <div className="h-[600px] relative bg-[#0f0f10]">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-28 bg-black rounded-b-2xl z-20" />

          {/* Ruta Clara top strip */}
          <div className={`absolute top-0 left-0 right-0 z-10 ${toneTint} border-b ${toneBorder} backdrop-blur-md`}>
            <div className="pt-8 pb-3 px-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${toneBg} shrink-0`} />
              <div className="min-w-0 flex items-baseline gap-2">
                <span className={`tabular text-2xl font-extrabold ${toneText} leading-none`}>${s.value}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">{s.unit}</span>
              </div>
              <button aria-label="Ver mapa" className="shrink-0 h-8 w-8 rounded-lg bg-surface/80 border border-border grid place-items-center text-muted-foreground">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              </button>
            </div>
            <div className="px-4 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              {s.label} · {s.msg}
            </div>
          </div>

          {/* Fondo genérico de otra app, solo para dar contexto visual */}
          <div className="pt-28 px-4 opacity-40">
            <div className="text-white/70 text-xs uppercase tracking-widest mb-3">Viaje entrante</div>
            <div className="rounded-xl bg-white/5 h-28 mb-3" />
            <div className="rounded-xl bg-white/5 h-16 mb-3" />
            <div className="rounded-xl bg-white/5 h-16" />
          </div>

          {/* Botón de aceptar del viaje — nunca queda tapado */}
          <div className="absolute bottom-6 left-4 right-4 rounded-xl bg-white text-black h-14 grid place-items-center font-semibold shadow-lg">
            Aceptar · 12s
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground max-w-xs mx-auto">
        Franja angosta arriba. Tu decisión no queda tapada.
      </p>

      <PrototypeNav />
    </div>
  );
}
