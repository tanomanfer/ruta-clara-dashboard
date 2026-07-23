import { createFileRoute } from "@tanstack/react-router";
import { PrototypeNav } from "@/components/PrototypeNav";

export const Route = createFileRoute("/trip-tablet")({
  head: () => ({
    meta: [
      { title: "Ruta Clara — Vista tablet" },
      { name: "description", content: "Ventana flotante sobre Uber + Waze en tablet." },
    ],
  }),
  component: TripTablet,
});

function TripTablet() {
  return (
    <div className="min-h-screen p-4 sm:p-8 pb-32">
      {/* Simulated tablet frame */}
      <div className="max-w-5xl mx-auto rounded-3xl border border-border bg-black overflow-hidden shadow-2xl">
        <div className="grid grid-cols-2 h-[560px] sm:h-[640px] relative">
          {/* Fake Uber panel */}
          <div className="relative bg-[#0f0f10] p-6 opacity-40">
            <div className="text-white/70 text-xs uppercase tracking-widest mb-4">Uber</div>
            <div className="rounded-xl bg-white/5 h-24 mb-3" />
            <div className="rounded-xl bg-white/5 h-24 mb-3" />
            <div className="rounded-xl bg-white/5 h-24" />
            <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-white/10 h-14 grid place-items-center text-white/50 text-sm">
              Aceptar viaje
            </div>
          </div>
          {/* Fake Waze panel */}
          <div className="relative bg-[#1e3a5f] opacity-40">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 20px)" }} />
            <div className="p-6 text-white/70 text-xs uppercase tracking-widest">Waze</div>
          </div>

          {/* Floating Ruta Clara window */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] rounded-2xl bg-surface border border-border shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Status bar */}
            <div className="bg-go/15 border-b border-go/30 px-4 py-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-go" />
              <span className="text-go text-xs font-semibold uppercase tracking-widest">Conviene</span>
              <span className="ml-auto text-[10px] text-muted-foreground tabular">Cierra en 4s</span>
            </div>

            <div className="p-5">
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Ganancia estimada</div>
                <div className="flex items-baseline gap-3">
                  <div>
                    <div className="tabular text-4xl font-extrabold text-go leading-none">$720</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">por km</div>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <div className="tabular text-4xl font-extrabold text-foreground leading-none">$6.4k</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">por hora</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                <MiniStat label="Distancia" value="8,2 km" />
                <MiniStat label="Tarifa" value="$5.900" />
                <MiniStat label="Tiempo" value="~14 min" />
              </div>

              <button className="mt-4 w-full rounded-lg border border-border bg-surface-2 py-2 text-xs text-muted-foreground flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Ver zona en el mapa
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground max-w-md mx-auto">
        La ventana aparece sola cuando llega un viaje y se cierra a los pocos segundos. No ocupa un panel fijo.
      </p>

      <PrototypeNav />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="tabular text-sm font-bold mt-0.5">{value}</div>
    </div>
  );
}
