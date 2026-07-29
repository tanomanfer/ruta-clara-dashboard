import { createFileRoute, Link } from "@tanstack/react-router";
import { PrototypeNav } from "@/components/PrototypeNav";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authed/home")({
  head: () => ({
    meta: [
      { title: "Ruta Clara — Home" },
      { name: "description", content: "Esperando viajes. Tu tablero del día." },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useAuth();

  const { data: perfil, isLoading: isLoadingPerfil } = useQuery({
    queryKey: ["perfil", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No hay usuario autenticado");
      const { data, error } = await supabase
        .from("perfiles")
        .select("objetivo_km, objetivo_hora")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const inicioDeHoy = new Date();
  inicioDeHoy.setHours(0, 0, 0, 0);

  const inicioDeManiana = new Date(inicioDeHoy);
  inicioDeManiana.setDate(inicioDeHoy.getDate() + 1);

  const { data: viajes, isLoading: isLoadingViajes } = useQuery({
    queryKey: ["viajes-hoy", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No hay usuario autenticado");
      const { data, error } = await supabase
        .from("viajes")
        .select("tarifa, rentabilidad_km, rentabilidad_hora, decision")
        .eq("user_id", user.id)
        .gte("created_at", inicioDeHoy.toISOString())
        .lt("created_at", inicioDeManiana.toISOString());

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoadingPerfil || isLoadingViajes) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md w-full">
          <p className="text-muted-foreground animate-pulse">Cargando tu tablero...</p>
        </div>
      </div>
    );
  }

  const viajesHoy = viajes || [];
  const aceptados = viajesHoy.filter((v) => v.decision === "aceptado");
  const cantidadViajes = aceptados.length;
  const gananciaHoy = aceptados.reduce((sum, v) => sum + Number(v.tarifa), 0);

  const promedioKm =
    cantidadViajes > 0
      ? aceptados.reduce((sum, v) => sum + Number(v.rentabilidad_km), 0) / cantidadViajes
      : null;

  const promedioHora =
    cantidadViajes > 0
      ? aceptados.reduce((sum, v) => sum + Number(v.rentabilidad_hora || 0), 0) / cantidadViajes
      : null;

  const objetivoKm = perfil?.objetivo_km ?? 0;
  const objetivoHora = perfil?.objetivo_hora ?? 0;

  const toneKm = promedioKm === null ? "warn" : promedioKm >= objetivoKm ? "go" : "stop";

  const toneHora = promedioHora === null ? "warn" : promedioHora >= objetivoHora ? "go" : "stop";

  const viajesLabel = cantidadViajes === 1 ? "1 viaje" : `${cantidadViajes} viajes`;
  const gananciaHoyFormateada = `$${Math.round(gananciaHoy).toLocaleString("es-AR")}`;

  const valKm = promedioKm !== null ? Math.round(promedioKm).toLocaleString("es-AR") : "—";
  const valHora = promedioHora !== null ? Math.round(promedioHora).toLocaleString("es-AR") : "—";

  const hintKm = `Objetivo ${Math.round(objetivoKm).toLocaleString("es-AR")}`;
  const hintHora = `Objetivo ${Math.round(objetivoHora).toLocaleString("es-AR")}`;

  return (
    <div className="min-h-screen px-5 py-6 pb-32">
      <div className="max-w-md mx-auto">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-8">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Ruta Clara</p>
            <p className="text-sm text-foreground/80">Miércoles · turno tarde</p>
          </div>
          <Link
            to="/setup"
            aria-label="Configuración"
            className="shrink-0 h-10 w-10 rounded-full border border-border bg-surface grid place-items-center text-muted-foreground hover:text-foreground"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
          </Link>
        </header>

        {/* Status */}
        <div className="rounded-2xl border border-border bg-surface p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-go opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-go" />
            </span>
            <span className="text-sm font-medium">Esperando viajes</span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Ganancia hoy
            </p>
            <div className="tabular text-6xl font-extrabold text-accent leading-none">
              {gananciaHoyFormateada}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{viajesLabel} · 4h 20m en línea</p>
          </div>
        </div>

        {/* Two-up stats — dashboard style */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MetricCard label="Promedio $/km" value={valKm} hint={hintKm} tone={toneKm} />
          <MetricCard label="Promedio $/hora" value={valHora} hint={hintHora} tone={toneHora} />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <QuickLink to="/history" label="Ver historial" />
          <QuickLink to="/trip-mobile" label="Simular viaje" />
        </div>
      </div>
      <PrototypeNav />
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "go" | "warn" | "stop";
}) {
  const toneClass = tone === "go" ? "text-go" : tone === "warn" ? "text-warn" : "text-stop";
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </div>
      <div className={`tabular text-3xl font-bold ${toneClass}`}>
        {value !== "—" && "$"}
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function QuickLink({ to, label }: { to: "/history" | "/trip-mobile"; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-center hover:bg-surface-2 transition-colors"
    >
      {label}
    </Link>
  );
}
