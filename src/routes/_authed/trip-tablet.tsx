import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PrototypeNav } from "@/components/PrototypeNav";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import "leaflet/dist/leaflet.css";

type Tone = "go" | "warn" | "stop";

const scenarios: Record<
  Tone,
  {
    label: string;
    rentabilidadKm: string;
    rentabilidadHora: string;
    tarifa: string;
    distancia: string;
    tiempo: string;
  }
> = {
  go: {
    label: "Conviene",
    rentabilidadKm: "720",
    rentabilidadHora: "6.4k",
    tarifa: "$5.900",
    distancia: "8,2 km",
    tiempo: "~14 min",
  },
  warn: {
    label: "Dudoso",
    rentabilidadKm: "480",
    rentabilidadHora: "4.2k",
    tarifa: "$4.100",
    distancia: "8,5 km",
    tiempo: "~20 min",
  },
  stop: {
    label: "No conviene",
    rentabilidadKm: "290",
    rentabilidadHora: "2.5k",
    tarifa: "$2.300",
    distancia: "7,9 km",
    tiempo: "~25 min",
  },
};

const MOTIVOS_LABELS: Record<string, string> = {
  inseguridad: "Inseguridad",
  calle_rota: "Calle en mal estado",
  otro: "Otro",
};

const MOTIVOS_COLORS: Record<string, string> = {
  inseguridad: "#E53935",
  calle_rota: "#FFB300",
  otro: "#9CA3AF",
};

export const Route = createFileRoute("/_authed/trip-tablet")({
  head: () => ({
    meta: [
      { title: "Ruta Clara — Vista tablet" },
      { name: "description", content: "Ventana flotante sobre tus otras apps en la tablet." },
    ],
  }),
  component: TripTablet,
});

function TripTablet() {
  const [tone, setTone] = useState<Tone>("go");
  const s = scenarios[tone];

  const { user } = useAuth();
  const [MapComponents, setMapComponents] = useState<any>(null);

  // Dynamic import of Leaflet and React-Leaflet to avoid window undefined errors in SSR
  useEffect(() => {
    if (typeof window !== "undefined") {
      Promise.all([
        import("leaflet"),
        import("react-leaflet")
      ]).then(([LModule, RLModule]) => {
        setMapComponents({ L: LModule.default || LModule, ...RLModule });
      }).catch((err) => {
        console.error("Error loading Leaflet: ", err);
      });
    }
  }, []);

  // Query zones nearby (within ~3km or +-0.03 degrees around destination: lat -34.6037, lng -58.3816)
  const { data: zonas = [] } = useQuery({
    queryKey: ["zonas-cercanas", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No hay usuario autenticado");
      const { data, error } = await supabase
        .from("zonas")
        .select("*")
        .gte("lat", -34.6037 - 0.03)
        .lte("lat", -34.6037 + 0.03)
        .gte("lng", -58.3816 - 0.03)
        .lte("lng", -58.3816 + 0.03);
      if (error) throw error;
      return data;
    },
    enabled: !!user && tone !== "stop",
  });

  const toneBgClass = tone === "go" ? "bg-go/15 border-go/30" : tone === "warn" ? "bg-warn/15 border-warn/30" : "bg-stop/15 border-stop/30";
  const toneTextClass = tone === "go" ? "text-go" : tone === "warn" ? "text-warn" : "text-stop";
  const toneDotClass = tone === "go" ? "bg-go" : tone === "warn" ? "bg-warn" : "bg-stop";

  return (
    <div className="min-h-screen p-4 sm:p-8 pb-32">
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

      {/* Simulated tablet frame */}
      <div className="max-w-5xl mx-auto rounded-3xl border border-border bg-black overflow-hidden shadow-2xl">
        <div className="grid grid-cols-2 h-[560px] sm:h-[640px] relative">
          {/* Panel genérico de una app de viajes, solo para dar contexto visual */}
          <div className="relative bg-[#0f0f10] p-6 opacity-40">
            <div className="text-white/70 text-xs uppercase tracking-widest mb-4">Viajes</div>
            <div className="rounded-xl bg-white/5 h-24 mb-3" />
            <div className="rounded-xl bg-white/5 h-24 mb-3" />
            <div className="rounded-xl bg-white/5 h-24" />
            <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-white/10 h-14 grid place-items-center text-white/50 text-sm">
              Aceptar viaje
            </div>
          </div>
          {/* Panel genérico de una app de mapa */}
          <div className="relative bg-[#1e3a5f] opacity-40">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 20px)" }} />
            <div className="p-6 text-white/70 text-xs uppercase tracking-widest">Mapa</div>
          </div>

          {/* Floating Ruta Clara window */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] rounded-2xl bg-surface border border-border shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Status bar */}
            <div className={`${toneBgClass} border-b px-4 py-2 flex items-center gap-2`}>
              <span className={`h-2.5 w-2.5 rounded-full ${toneDotClass}`} />
              <span className={`${toneTextClass} text-xs font-semibold uppercase tracking-widest`}>{s.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground tabular">Cierra en 4s</span>
            </div>

            <div className="p-5">
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Ganancia estimada</div>
                <div className="flex items-baseline gap-3">
                  <div>
                    <div className={`tabular text-4xl font-extrabold ${toneTextClass} leading-none`}>${s.rentabilidadKm}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">por km</div>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <div className="tabular text-4xl font-extrabold text-foreground leading-none">${s.rentabilidadHora}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">por hora</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                <MiniStat label="Distancia" value={s.distancia} />
                <MiniStat label="Tarifa" value={s.tarifa} />
                <MiniStat label="Tiempo" value={s.tiempo} />
              </div>

              {(tone === "go" || tone === "warn") && (
                <div className="mt-4 pt-3 border-t border-border">
                  {/* NOTA TEMPORAL: Destino de ejemplo hardcodeado (Obelisco, Buenos Aires).
                      En el futuro, esta información se leerá mediante OCR/Screen reading de las apps de Uber/DiDi. */}
                  <div className="h-40 rounded-lg overflow-hidden border border-border">
                    {MapComponents ? (() => {
                      const { L, MapContainer, TileLayer, Marker, Popup, Circle } = MapComponents;

                      const createMarkerIcon = (color: string, isSpecial = false) => {
                        const size = isSpecial ? 24 : 20;
                        const border = isSpecial ? "3px solid #FFFFFF" : "2px solid #FFFFFF";
                        const markerHtml = isSpecial 
                          ? `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${border}; box-shadow: 0 2px 6px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; color: white;">!</div>`
                          : `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${border}; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;

                        return L.divIcon({
                          className: "custom-leaflet-icon",
                          html: markerHtml,
                          iconSize: [size, size],
                          iconAnchor: [size / 2, size / 2],
                          popupAnchor: [0, -size / 2],
                        });
                      };

                      return (
                        <MapContainer
                          center={[-34.6037, -58.3816]}
                          zoom={15}
                          className="w-full h-full border-0"
                          scrollWheelZoom={false}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />
                          {/* Destino Marker */}
                          <Marker position={[-34.6037, -58.3816]} icon={createMarkerIcon("#FF6B35", true)}>
                            <Popup>
                              <div className="text-slate-900 font-semibold text-xs text-center min-w-[60px]">
                                Destino
                              </div>
                            </Popup>
                          </Marker>

                          {/* Zonas de riesgo cercanas */}
                          {zonas.map((z: any) => {
                            const color = MOTIVOS_COLORS[z.motivo] || "#9CA3AF";
                            return [
                              <Circle
                                key={`${z.id}-circle`}
                                center={[z.lat, z.lng]}
                                radius={500}
                                pathOptions={{ color: color, fillColor: color, fillOpacity: 0.15, weight: 1 }}
                              />,
                              <Marker key={`${z.id}-marker`} position={[z.lat, z.lng]} icon={createMarkerIcon(color)}>
                                <Popup>
                                  <div className="text-slate-900 min-w-[120px] text-xs">
                                    <p className="font-bold text-sm text-slate-900 mb-1">
                                      {MOTIVOS_LABELS[z.motivo] || z.motivo}
                                    </p>
                                    {z.nota && <p className="text-slate-700 leading-snug">{z.nota}</p>}
                                  </div>
                                </Popup>
                              </Marker>
                            ];
                          })}
                        </MapContainer>
                      );
                    })() : (
                      <div className="w-full h-full bg-surface/50 flex items-center justify-center">
                        <p className="text-muted-foreground text-xs animate-pulse">Cargando mapa...</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-1.5 text-center">
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=-34.6037,-58.3816"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-muted-foreground hover:text-foreground underline"
                    >
                      Abrir en Google Maps
                    </a>
                  </div>
                </div>
              )}
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
