import { useState } from "react";

type Tone = "go" | "warn" | "stop";

const scenarios: Record<
  Tone,
  { label: string; value: string; hourly: string; message: string }
> = {
  go: { label: "Verde", value: "720", hourly: "5.180", message: "Buen precio por km" },
  warn: { label: "Ámbar", value: "480", hourly: "3.960", message: "Precio dudoso" },
  stop: { label: "Rojo", value: "290", hourly: "2.240", message: "No conviene económicamente" },
};

const toneClasses: Record<Tone, { text: string; ring: string; glow: string; bg: string; dot: string }> = {
  go: {
    text: "text-go",
    ring: "border-go/40",
    glow: "shadow-[0_0_60px_-12px_var(--go)]",
    bg: "bg-go/10",
    dot: "bg-go",
  },
  warn: {
    text: "text-warn",
    ring: "border-warn/40",
    glow: "shadow-[0_0_60px_-12px_var(--warn)]",
    bg: "bg-warn/10",
    dot: "bg-warn",
  },
  stop: {
    text: "text-stop",
    ring: "border-stop/40",
    glow: "shadow-[0_0_60px_-12px_var(--stop)]",
    bg: "bg-stop/10",
    dot: "bg-stop",
  },
};

export function SemaphoreShowcase() {
  const [tone, setTone] = useState<Tone>("go");
  const s = scenarios[tone];
  const c = toneClasses[tone];

  return (
    <div className="max-w-sm mx-auto">
      <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1">
        {(Object.keys(scenarios) as Tone[]).map((t) => (
          <button
            key={t}
            onClick={() => setTone(t)}
            className={`py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              tone === t ? `${toneClasses[t].bg} ${toneClasses[t].text}` : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {scenarios[t].label}
          </button>
        ))}
      </div>

      <div
        className={`rounded-2xl border ${c.ring} ${c.bg} p-8 text-center transition-all duration-500 ${c.glow}`}
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Este viaje</span>
        </div>

        <div className={`tabular text-6xl font-extrabold ${c.text} leading-none mb-2`}>
          ${s.value}
          <span className="text-lg font-semibold text-muted-foreground ml-1">/km</span>
        </div>

        <p className={`text-sm font-semibold ${c.text} mb-6`}>{s.message}</p>

        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2">
          <span className="text-xs text-muted-foreground">$/hora estimado</span>
          <span className="tabular text-sm font-bold">${s.hourly}</span>
        </div>
      </div>
    </div>
  );
}
