import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PrototypeNav } from "@/components/PrototypeNav";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import "leaflet/dist/leaflet.css";

type Tone = "go" | "warn" | "stop";
const scenarios: Record<Tone, { label: string; value: string; unit: string; msg: string }> = {
  go: { label: "Conviene", value: "720", unit: "$/km", msg: "Buen viaje" },
  warn: { label: "Dudoso", value: "480", unit: "$/km", msg: "Justo en el límite" },
  stop: { label: "No conviene", value: "290", unit: "$/km", msg: "Muy por debajo" },
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
