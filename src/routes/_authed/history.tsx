import { createFileRoute, Link } from "@tanstack/react-router";
import { PrototypeNav } from "@/components/PrototypeNav";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authed/history")({
  head: () => ({
    meta: [
      { title: "Ruta Clara — Historial" },
      { name: "description", content: "Historial de viajes con $/km, $/hora y estado." },
    ],
  }),
  component: History,
});

interface DBViaje {
  id: string;
  created_at: string;
  tarifa: number;
  rentabilidad_km: number;
  rentabilidad_hora: number | null;
  estado: "verde" | "amarillo" | "rojo";
  decision: "aceptado" | "rechazado" | null;
}

function History() {
  const { user } = useAuth();

  const inicioDeHoy = new Date();
  inicioDeHoy.setHours(0, 0, 0, 0);

  const inicioDeManiana = new Date(inicioDeHoy);
  inicioDeManiana.setDate(inicioDeHoy.getDate() + 1);

  const { data: viajes, isLoading } = useQuery<DBViaje[]>({
    queryKey: ["viajes-hoy-historial", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No hay usuario autenticado");
      const { data, error } = await supabase
        .from("viajes")
        .select("id, created_at, tarifa, rentabilidad_km, rentabilidad_hora, estado, decision")
        .eq("user_id", user.id)
        .gte("created_at", inicioDeHoy.toISOString())
        .lt("created_at", inicioDeManiana.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DBViaje[];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md w-full">
          <p className="text-muted-foreground animate-pulse">Cargando tu historial...</p>
        </div>
      </div>
    );
  }

  const viajesHoy = viajes || [];
  const aceptados = viajesHoy.filter((v) => v.decision === "aceptado");
  const gananciaDelDia = aceptados.reduce((sum, v) => sum + Number(v.tarifa), 0);

  const promedioKm =
    aceptados.length > 0
      ? aceptados.reduce((sum, v) => sum + Number(v.rentabilidad_km), 0) / aceptados.length
      : null;

  const promedioHora =
    aceptados.length > 0
      ? aceptados.reduce((sum, v) => sum + Number(v.rentabilidad_hora || 0), 0) / aceptados.length
      : null;

  const gananciaFormateada = `$${Math.round(gananciaDelDia).toLocaleString("es-AR")}`;
  const promedioKmFormateado =
    promedioKm !== null ? Math.round(promedioKm).toLocaleString("es-AR") : "—";
  const promedioHoraFormateado =
    promedioHora !== null ? Math.round(promedioHora).toLocaleString("es-AR") : "—";

  return (
    <div className="min-h-screen px-5 py-6 pb-32">
      <div className="max-w-md mx-auto">
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 mb-6">
          <Link
            to="/home"
            aria-label="Volver"
            className="shrink-0 h-10 w-10 rounded-full border border-border bg-surface grid place-items-center text-muted-foreground"
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
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Historial</p>
            <h1 className="text-2xl font-bold truncate">Hoy</h1>
          </div>
        </header>

        {/* Summary */}
        <div className="rounded-2xl border border-border bg-surface p-5 mb-6">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Ganancia del día
          </div>
          <div className="tabular text-5xl font-extrabold text-accent leading-none">
            {gananciaFormateada}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-border">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Promedio $/km
              </div>
              <div className="tabular text-xl font-bold mt-1">
                {promedioKmFormateado !== "—" && "$"}
                {promedioKmFormateado}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Promedio $/hora
              </div>
              <div className="tabular text-xl font-bold mt-1">
                {promedioHoraFormateado !== "—" && "$"}
                {promedioHoraFormateado}
              </div>
            </div>
          </div>
        </div>

        {viajesHoy.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            Todavía no registraste viajes hoy.
          </p>
        ) : (
          <>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 px-1">
              {viajesHoy.length} {viajesHoy.length === 1 ? "viaje ofrecido" : "viajes ofrecidos"}
            </div>

            <ul className="space-y-2">
              {viajesHoy.map((t) => (
                <TripRow key={t.id} trip={t} />
              ))}
            </ul>
          </>
        )}
      </div>
      <PrototypeNav />
    </div>
  );
}

function TripRow({ trip }: { trip: DBViaje }) {
  const toneBg =
    trip.estado === "verde" ? "bg-go" : trip.estado === "amarillo" ? "bg-warn" : "bg-stop";

  const timeStr = new Date(trip.created_at).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let decisionLabel = "Rechazado";
  let decisionClass = "text-muted-foreground bg-surface-2";
  if (trip.decision === "aceptado") {
    decisionLabel = "Aceptado";
    decisionClass = "text-go bg-go/10";
  } else if (trip.decision === null) {
    decisionLabel = "Sin registrar";
    decisionClass = "text-muted-foreground bg-surface-2";
  }

  const perKmVal = Math.round(Number(trip.rentabilidad_km)).toLocaleString("es-AR");
  const perHourVal = Math.round(Number(trip.rentabilidad_hora || 0)).toLocaleString("es-AR");

  return (
    <li className="rounded-xl border border-border bg-surface p-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      <span className={`h-3 w-3 rounded-full ${toneBg} shrink-0`} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="tabular text-lg font-bold">${perKmVal}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">/km</span>
          <span className="tabular text-sm text-muted-foreground ml-auto">
            ${perHourVal}
            <span className="text-[10px] ml-1">/h</span>
          </span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground tabular">{timeStr}</div>
      </div>
      <span
        className={`shrink-0 text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-md ${decisionClass}`}
      >
        {decisionLabel}
      </span>
    </li>
  );
}
