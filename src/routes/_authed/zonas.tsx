import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PrototypeNav } from "@/components/PrototypeNav";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/_authed/zonas")({
  head: () => ({
    meta: [
      { title: "Ruta Clara — Zonas" },
    ],
  }),
  component: Zonas,
});

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

function Zonas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [mapCenter, setMapCenter] = useState<[number, number]>([-34.6037, -58.3816]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [verCompartidas, setVerCompartidas] = useState(false);
  const [puntoCandidato, setPuntoCandidato] = useState<{ lat: number; lng: number } | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [motivo, setMotivo] = useState<"inseguridad" | "calle_rota" | "otro">("inseguridad");
  const [nota, setNota] = useState("");
  const [compartir, setCompartir] = useState(false);

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

  // Geolocation setup
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setMapCenter(coords);
          setUserLocation(coords);
        },
        (error) => {
          console.warn("Geolocation warning: ", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // Query zones
  const { data: zonas = [] } = useQuery({
    queryKey: ["zonas", user?.id, verCompartidas],
    queryFn: async () => {
      if (!user) throw new Error("No hay usuario autenticado");
      let query = supabase.from("zonas").select("*");
      if (!verCompartidas) {
        query = query.eq("user_id", user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Mutations
  const insertMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No hay usuario autenticado");
      if (!puntoCandidato) throw new Error("No se ha seleccionado ningún punto");

      const { error } = await supabase.from("zonas").insert({
        user_id: user.id,
        lat: puntoCandidato.lat,
        lng: puntoCandidato.lng,
        motivo,
        nota: nota.trim() || null,
        compartido: compartir,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zonas"] });
      toast.success("Zona guardada");
      setPuntoCandidato(null);
      setMostrarFormulario(false);
      setNota("");
      setCompartir(false);
      setMotivo("inseguridad");
    },
    onError: (error) => {
      console.error(error);
      toast.error("No pudimos guardar la zona. Probá de nuevo.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (zonaId: string) => {
      const { error } = await supabase.from("zonas").delete().eq("id", zonaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zonas"] });
      toast.success("Zona eliminada");
    },
    onError: (error) => {
      console.error(error);
      toast.error("No pudimos borrar la zona.");
    },
  });

  const ClickHandler = useMemo(() => {
    if (!MapComponents) return null;
    const { useMapEvents } = MapComponents;
    return function ClickHandlerInner() {
      useMapEvents({
        click(e: any) {
          setPuntoCandidato({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
        dblclick(e: any) {
          setPuntoCandidato({ lat: e.latlng.lat, lng: e.latlng.lng });
          setMostrarFormulario(true);
        },
      });
      return null;
    };
  }, [MapComponents]);

  const MapRefresher = useMemo(() => {
    if (!MapComponents) return null;
    const { useMap } = MapComponents;
    return function MapRefresherInner({ center }: { center: [number, number] }) {
      const map = useMap();
      useEffect(() => {
        map.setView(center, map.getZoom());
      }, [center, map]);
      return null;
    };
  }, [MapComponents]);

  let mapContent = null;

  if (MapComponents && ClickHandler && MapRefresher) {
    const { L, MapContainer, TileLayer, Marker, Popup } = MapComponents;

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

    mapContent = (
      <MapContainer
        center={mapCenter}
        zoom={14}
        className="h-[60vh] w-full rounded-xl overflow-hidden border border-border"
        scrollWheelZoom={true}
        doubleClickZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ClickHandler />
        <MapRefresher center={mapCenter} />

        {/* User Location Marker (Blue) */}
        {userLocation && (
          <Marker position={userLocation} icon={createMarkerIcon("#3B82F6")}>
            <Popup>
              <div className="text-slate-900 font-semibold text-xs text-center min-w-[100px]">
                Tu ubicación actual
              </div>
            </Popup>
          </Marker>
        )}

        {/* Existing Zones Markers */}
        {zonas.map((z: any) => {
          const color = MOTIVOS_COLORS[z.motivo] || "#9CA3AF";
          return (
            <Marker key={z.id} position={[z.lat, z.lng]} icon={createMarkerIcon(color)}>
              <Popup>
                <div className="text-slate-900 min-w-[140px] text-xs">
                  <p className="font-bold text-sm text-slate-900 mb-1">{MOTIVOS_LABELS[z.motivo] || z.motivo}</p>
                  {z.nota && <p className="text-slate-700 mb-1 leading-snug">{z.nota}</p>}
                  {z.compartido && (
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                      Compartida
                    </p>
                  )}
                  {z.user_id === user?.id && (
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(z.id)}
                      disabled={deleteMutation.isPending}
                      className="mt-2 w-full text-xs text-left text-stop font-semibold hover:underline border-t border-slate-100 pt-1.5"
                    >
                      {deleteMutation.isPending ? "Borrando..." : "Borrar zona"}
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Proposed New Zone Marker (Naranja de acento) */}
        {puntoCandidato && (
          <Marker
            position={[puntoCandidato.lat, puntoCandidato.lng]}
            icon={createMarkerIcon("#FF6B35", true)}
          >
            <Popup>
              <div className="text-slate-900 text-xs font-semibold text-center min-w-[120px]">
                Nueva zona propuesta
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    );
  } else {
    mapContent = (
      <div className="h-[60vh] w-full rounded-xl border border-border bg-surface/50 flex flex-col items-center justify-center text-center px-6">
        <p className="text-muted-foreground animate-pulse">Cargando mapa...</p>
      </div>
    );
  }

  const isFormVisible = mostrarFormulario && puntoCandidato;

  return (
    <div className={`min-h-screen px-5 py-6 transition-all ${isFormVisible ? "pb-72" : "pb-32"}`}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 mb-6">
          <Link
            to="/home"
            aria-label="Volver"
            className="shrink-0 h-10 w-10 rounded-full border border-border bg-surface grid place-items-center text-muted-foreground hover:text-foreground active:scale-[0.98] transition-transform"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Zonas de Riesgo</p>
            <h1 className="text-2xl font-bold truncate">Zonas</h1>
          </div>
        </header>

        <p className="text-muted-foreground text-sm mb-6">
          Marcá zonas de riesgo o problemas en el camino.
        </p>

        {/* Map */}
        <div className="mb-4">
          {mapContent}
        </div>

        {/* Ver Compartidas Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface mb-6">
          <span className="text-sm font-medium text-foreground pr-2">
            Ver también zonas compartidas por otros choferes
          </span>
          <button
            type="button"
            onClick={() => setVerCompartidas(!verCompartidas)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              verCompartidas ? "bg-accent" : "bg-neutral-700"
            }`}
            role="switch"
            aria-checked={verCompartidas}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                verCompartidas ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Help Text in normal flow when form is hidden */}
        {!isFormVisible && (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted-foreground">
            Tocá el mapa para ubicar el punto. Doble clic para fijarlo y cargar los datos.
          </div>
        )}

        {/* Fixed Floating Form Panel */}
        {isFormVisible && (
          <div className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-6 pt-4 bg-surface border-t border-border rounded-t-3xl shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.6)]">
            <div className="max-w-md mx-auto space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-lg font-bold">Nueva zona</h3>
                <span className="text-[10px] text-muted-foreground tabular">
                  {puntoCandidato.lat.toFixed(4)}, {puntoCandidato.lng.toFixed(4)}
                </span>
              </div>

              {/* Selector de Motivo */}
              <div>
                <span className="block text-sm text-muted-foreground mb-2">Motivo</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["inseguridad", "calle_rota", "otro"] as const).map((m) => {
                    const label = m === "inseguridad" ? "Inseguridad" : m === "calle_rota" ? "Calle rota" : "Otro";
                    const isSelected = motivo === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMotivo(m)}
                        className={`rounded-xl border py-3 text-xs font-semibold text-center transition-colors bg-surface ${
                          isSelected
                            ? "border-accent text-accent"
                            : "border-border text-muted-foreground hover:bg-surface-2"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea para Nota */}
              <div>
                <label className="block">
                  <span className="block text-sm text-muted-foreground mb-2">Nota</span>
                  <textarea
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Aclaración opcional"
                    rows={2}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-accent transition-colors resize-none"
                  />
                </label>
              </div>

              {/* Compartir Switch */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground pr-2">Compartir esta zona con la comunidad</span>
                <button
                  type="button"
                  onClick={() => setCompartir(!compartir)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    compartir ? "bg-accent" : "bg-neutral-700"
                  }`}
                  role="switch"
                  aria-checked={compartir}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      compartir ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPuntoCandidato(null);
                    setMostrarFormulario(false);
                  }}
                  className="rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-center hover:bg-surface-2 text-foreground active:scale-[0.98] transition-transform"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => insertMutation.mutate()}
                  disabled={insertMutation.isPending}
                  className="rounded-xl bg-accent py-3 text-sm font-semibold text-center text-accent-foreground active:scale-[0.98] transition-transform disabled:opacity-50 disabled:scale-100"
                >
                  {insertMutation.isPending ? "Guardando..." : "Guardar zona"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <PrototypeNav />
    </div>
  );
}
