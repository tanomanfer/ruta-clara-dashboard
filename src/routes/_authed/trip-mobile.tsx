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
            <div className="pt-8 pb-3 px-4 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${toneBg} shrink-0`} />
              <div className="min-w-0 flex items-baseline gap-2">
                <span className={`tabular text-2xl font-extrabold ${toneText} leading-none`}>${s.value}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">{s.unit}</span>
              </div>
            </div>
            <div className="px-4 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              {s.label} · {s.msg}
            </div>

            {/* Mapa integrado condicional para go o warn */}
            {(tone === "go" || tone === "warn") && (
              <div className="px-4 pb-3">
                {/* NOTA TEMPORAL: Destino de ejemplo hardcodeado (Obelisco, Buenos Aires).
                    En el futuro, esta información se leerá mediante OCR/Screen reading de las apps de Uber/DiDi. */}
                <div className="h-32 rounded-xl overflow-hidden border border-border">
                  <iframe
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-58.3916,-34.6087,-58.3716,-34.5987&layer=mapnik&marker=-34.6037,-58.3816"
                    className="w-full h-full border-0"
                    loading="lazy"
                    title="Zona de destino"
                  />
                </div>
                <div className="mt-1.5 text-center">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=-34.6037,-58.3816"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-muted-foreground hover:text-foreground underline"
                  >
                    Abrir en Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Fondo genérico de otra app, solo para dar contexto visual */}
          <div className={`px-4 opacity-40 transition-all ${(tone === "go" || tone === "warn") ? "pt-[265px]" : "pt-28"}`}>
            <div className="text-white/70 text-xs uppercase tracking-widest mb-3">Viaje entrante</div>
            {(tone === "go" || tone === "warn") ? (
              <>
                <div className="rounded-xl bg-white/5 h-20 mb-3" />
                <div className="rounded-xl bg-white/5 h-12" />
              </>
            ) : (
              <>
                <div className="rounded-xl bg-white/5 h-28 mb-3" />
                <div className="rounded-xl bg-white/5 h-16 mb-3" />
                <div className="rounded-xl bg-white/5 h-16" />
              </>
            )}
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
