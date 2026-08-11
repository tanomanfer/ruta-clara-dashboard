import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PrototypeNav } from "@/components/PrototypeNav";

export const Route = createFileRoute("/_authed/registrar-viaje")({
  head: () => ({
    meta: [
      { title: "Ruta Clara — Registrar viaje" },
    ],
  }),
  component: RegistrarViaje,
});

function RegistrarViaje() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: perfil, isLoading: isLoadingPerfil } = useQuery({
    queryKey: ["perfil", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No hay usuario autenticado");
      const { data, error } = await supabase
        .from("perfiles")
        .select("objetivo_km, objetivo_hora, criterio_evaluacion")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [plataforma, setPlataforma] = useState<"uber" | "didi">("uber");
  const [tarifa, setTarifa] = useState("");
  const [distanciaKm, setDistanciaKm] = useState("");
  const [tiempoMin, setTiempoMin] = useState("");
  const [decision, setDecision] = useState<"aceptado" | "rechazado">("aceptado");
  const [resultado, setResultado] = useState<{
    estado: "verde" | "amarillo" | "rojo";
    rentabilidadKm: number;
    rentabilidadHora: number | null;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      plataforma,
      tarifa,
      distanciaKm,
      tiempoMin,
      decision,
    }: {
      plataforma: "uber" | "didi";
      tarifa: string;
      distanciaKm: string;
      tiempoMin: string;
      decision: "aceptado" | "rechazado";
    }) => {
      if (!user) throw new Error("No hay usuario autenticado");

      const numTarifa = Number(tarifa);
      const numDistancia = Number(distanciaKm);
      const numTiempo = tiempoMin ? Number(tiempoMin) : null;

      // Calcular rentabilidades
      const rentabilidadKm = numTarifa / numDistancia;
      const rentabilidadHora = numTiempo ? numTarifa / (numTiempo / 60) : null;

      const criterio = perfil?.criterio_evaluacion;
      const objetivo = criterio === "km" ? (perfil?.objetivo_km ?? 0) : (perfil?.objetivo_hora ?? 0);
      const valorRelevante = criterio === "km" ? rentabilidadKm : rentabilidadHora;

      let estado: "verde" | "amarillo" | "rojo" = "rojo";
      if (valorRelevante !== null) {
        if (valorRelevante >= objetivo) {
          estado = "verde";
        } else if (valorRelevante >= objetivo * 0.9) {
          estado = "amarillo";
        } else {
          estado = "rojo";
        }
      }

      const { error } = await supabase.from("viajes").insert({
        user_id: user.id,
        plataforma,
        tarifa: numTarifa,
        distancia_km: numDistancia,
        tiempo_estimado_min: numTiempo,
        rentabilidad_km: rentabilidadKm,
        rentabilidad_hora: rentabilidadHora,
        estado,
        decision,
      });

      if (error) throw error;
      return { estado, rentabilidadKm, rentabilidadHora };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["viajes-hoy", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["viajes-hoy-historial", user?.id] });
      toast.success("Viaje registrado");
      setResultado(data);
    },
    onError: () => {
      toast.error("No pudimos guardar el viaje. Probá de nuevo.");
    },
  });

  if (isLoadingPerfil) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md w-full">
          <p className="text-muted-foreground animate-pulse">Cargando...</p>
        </div>
      </div>
    );
  }

  const handleGuardar = () => {
    const numTarifa = Number(tarifa);
    const numDistancia = Number(distanciaKm);
    const numTiempo = tiempoMin ? Number(tiempoMin) : 0;

    if (!tarifa || isNaN(numTarifa) || numTarifa <= 0) {
      toast.error("La tarifa del viaje debe ser un número mayor a 0");
      return;
    }

    if (!distanciaKm || isNaN(numDistancia) || numDistancia <= 0) {
      toast.error("La distancia debe ser un número mayor a 0");
      return;
    }

    if (perfil?.criterio_evaluacion === "hora") {
      if (!tiempoMin || isNaN(numTiempo) || numTiempo <= 0) {
        toast.error("Con tu criterio actual necesitamos el tiempo estimado");
        return;
      }
    }

    mutation.mutate({
      plataforma,
      tarifa,
      distanciaKm,
      tiempoMin,
      decision,
    });
  };

  const isHoraCriterio = perfil?.criterio_evaluacion === "hora";
  const tiempoHelperText = isHoraCriterio ? (
    <span className="text-stop font-semibold">Obligatorio si tu criterio es $/hora</span>
  ) : (
    "Opcional"
  );

  return (
    <div className="min-h-screen px-5 py-6 pb-32">
      <div className="max-w-md mx-auto">
        {resultado ? (
          <Confirmacion
            resultado={resultado}
            setResultado={setResultado}
            setTarifa={setTarifa}
            setDistanciaKm={setDistanciaKm}
            setTiempoMin={setTiempoMin}
          />
        ) : (
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
              Registrar Viaje
            </p>
            <h1 className="text-3xl font-bold mb-2">Cargar viaje manual</h1>
            <p className="text-muted-foreground mb-8">
              Ingresá los datos del viaje para guardarlo en tu historial y ver su rentabilidad.
            </p>

            <div className="space-y-6">
              {/* Plataforma Selector */}
              <div className="block">
                <span className="block text-sm text-muted-foreground mb-2">Plataforma</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlataforma("uber")}
                    className={`rounded-xl border py-4 text-sm font-semibold text-center transition-colors bg-surface ${
                      plataforma === "uber"
                        ? "border-accent text-accent"
                        : "border-border text-muted-foreground hover:bg-surface-2"
                    }`}
                  >
                    Uber
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlataforma("didi")}
                    className={`rounded-xl border py-4 text-sm font-semibold text-center transition-colors bg-surface ${
                      plataforma === "didi"
                        ? "border-accent text-accent"
                        : "border-border text-muted-foreground hover:bg-surface-2"
                    }`}
                  >
                    DiDi
                  </button>
                </div>
              </div>

              {/* Input Fields */}
              <Field
                label="Tarifa del viaje"
                suffix="$"
                value={tarifa}
                onChange={setTarifa}
                allowDecimal={true}
              />
              <Field
                label="Distancia"
                suffix="km"
                value={distanciaKm}
                onChange={setDistanciaKm}
                allowDecimal={true}
              />
              <Field
                label="Tiempo estimado"
                suffix="min"
                value={tiempoMin}
                onChange={setTiempoMin}
                allowDecimal={false}
                helperText={tiempoHelperText}
              />

              {/* Decisión Selector */}
              <div className="block">
                <span className="block text-sm text-muted-foreground mb-2">Decisión</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision("aceptado")}
                    className={`rounded-xl border py-4 text-sm font-semibold text-center transition-colors bg-surface ${
                      decision === "aceptado"
                        ? "border-accent text-accent"
                        : "border-border text-muted-foreground hover:bg-surface-2"
                    }`}
                  >
                    Acepté el viaje
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("rechazado")}
                    className={`rounded-xl border py-4 text-sm font-semibold text-center transition-colors bg-surface ${
                      decision === "rechazado"
                        ? "border-accent text-accent"
                        : "border-border text-muted-foreground hover:bg-surface-2"
                    }`}
                  >
                    Rechacé el viaje
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleGuardar}
              disabled={mutation.isPending}
              className="mt-10 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-accent-foreground active:scale-[0.98] transition-transform disabled:opacity-50 disabled:scale-100"
            >
              {mutation.isPending ? "Guardando..." : "Guardar viaje"}
            </button>
          </div>
        )}
      </div>
      <PrototypeNav />
    </div>
  );
}

function Field({
  label,
  suffix,
  value,
  onChange,
  allowDecimal = false,
  helperText,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  allowDecimal?: boolean;
  helperText?: string | React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm text-muted-foreground mb-2">{label}</span>
      <div className="flex items-center rounded-xl border border-border bg-surface px-4 py-4 focus-within:border-accent transition-colors">
        <input
          type="text"
          inputMode={allowDecimal ? "decimal" : "numeric"}
          value={value}
          onChange={(e) => {
            let val = e.target.value;
            if (allowDecimal) {
              val = val.replace(",", ".");
              val = val.replace(/[^0-9.]/g, "");
              const parts = val.split(".");
              if (parts.length > 2) {
                val = parts[0] + "." + parts.slice(1).join("");
              }
            } else {
              val = val.replace(/[^0-9]/g, "");
            }
            onChange(val);
          }}
          className="tabular flex-1 bg-transparent text-4xl font-bold outline-none min-w-0"
        />
        <span className="text-sm text-muted-foreground shrink-0 ml-2">{suffix}</span>
      </div>
      {helperText && (
        <p className="mt-1.5 text-xs text-muted-foreground">{helperText}</p>
      )}
    </label>
  );
}

function Confirmacion({
  resultado,
  setResultado,
  setTarifa,
  setDistanciaKm,
  setTiempoMin,
}: {
  resultado: {
    estado: "verde" | "amarillo" | "rojo";
    rentabilidadKm: number;
    rentabilidadHora: number | null;
  };
  setResultado: (v: null) => void;
  setTarifa: (v: string) => void;
  setDistanciaKm: (v: string) => void;
  setTiempoMin: (v: string) => void;
}) {
  const colorMap = {
    verde: {
      text: "text-go",
      bg: "bg-go/15",
      border: "border-go/40",
      label: "Excelente rentabilidad",
    },
    amarillo: {
      text: "text-warn",
      bg: "bg-warn/15",
      border: "border-warn/40",
      label: "Rentabilidad moderada",
    },
    rojo: {
      text: "text-stop",
      bg: "bg-stop/15",
      border: "border-stop/40",
      label: "Baja rentabilidad",
    },
  };

  const config = colorMap[resultado.estado];

  return (
    <div className="text-center py-8">
      <div className="flex justify-center mb-6">
        <span className="relative flex h-16 w-16">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-35 ${
            resultado.estado === 'verde' ? 'bg-go' : resultado.estado === 'amarillo' ? 'bg-warn' : 'bg-stop'
          }`} />
          <span className={`relative inline-flex rounded-full h-16 w-16 ${
            resultado.estado === 'verde' ? 'bg-go' : resultado.estado === 'amarillo' ? 'bg-warn' : 'bg-stop'
          }`} />
        </span>
      </div>
      <h1 className="text-3xl font-bold mb-1">Viaje registrado</h1>
      <p className={`text-sm font-semibold mb-8 uppercase tracking-wider ${config.text}`}>
        {config.label}
      </p>

      {/* Rentabilidad metrics */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-xl bg-surface border border-border p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            $/km obtenido
          </div>
          <div className={`tabular text-3xl font-bold ${config.text}`}>
            ${Math.round(resultado.rentabilidadKm).toLocaleString("es-AR")}
          </div>
        </div>
        <div className="rounded-xl bg-surface border border-border p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            $/hora obtenido
          </div>
          <div className="tabular text-3xl font-bold text-foreground">
            {resultado.rentabilidadHora !== null
              ? `$${Math.round(resultado.rentabilidadHora).toLocaleString("es-AR")}`
              : "—"}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            setResultado(null);
            setTarifa("");
            setDistanciaKm("");
            setTiempoMin("");
          }}
          className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-accent-foreground active:scale-[0.98] transition-transform"
        >
          Cargar otro viaje
        </button>
        <Link
          to="/home"
          className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-6 py-4 text-base font-semibold text-foreground hover:bg-surface-2 active:scale-[0.98] transition-transform"
        >
          Volver a home
        </Link>
      </div>
    </div>
  );
}
