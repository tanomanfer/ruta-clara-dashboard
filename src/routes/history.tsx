import { createFileRoute, Link } from "@tanstack/react-router";
import { PrototypeNav } from "@/components/PrototypeNav";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Ruta Clara — Historial" },
      { name: "description", content: "Historial de viajes con $/km, $/hora y estado." },
    ],
  }),
  component: History,
});

type Trip = {
  time: string;
  perKm: number;
  perHour: number;
  tone: "go" | "warn" | "stop";
  accepted: boolean;
};

const trips: Trip[] = [
  { time: "19:42", perKm: 720, perHour: 6400, tone: "go", accepted: true },
  { time: "19:10", perKm: 610, perHour: 5100, tone: "go", accepted: true },
  { time: "18:38", perKm: 290, perHour: 2200, tone: "stop", accepted: false },
  { time: "18:12", perKm: 480, perHour: 3900, tone: "warn", accepted: true },
  { time: "17:44", perKm: 810, perHour: 7200, tone: "go", accepted: true },
  { time: "17:20", perKm: 340, perHour: 2600, tone: "stop", accepted: false },
  { time: "16:55", perKm: 560, perHour: 4600, tone: "go", accepted: true },
];


function History() {
  const accepted = trips.filter((t) => t.accepted);
  const total = accepted.reduce((sum, t) => sum + t.perHour * (25 / 60), 0);

  return (
    <div className="min-h-screen px-5 py-6 pb-32">
      <div className="max-w-md mx-auto">
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 mb-6">
          <Link to="/home" aria-label="Volver" className="shrink-0 h-10 w-10 rounded-full border border-border bg-surface grid place-items-center text-muted-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Historial</p>
            <h1 className="text-2xl font-bold truncate">Hoy</h1>
          </div>
        </header>

        {/* Summary */}
        <div className="rounded-2xl border border-border bg-surface p-5 mb-6">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Ganancia del día</div>
          <div className="tabular text-5xl font-extrabold text-accent leading-none">
            ${Math.round(total).toLocaleString("es-AR")}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-border">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Promedio $/km</div>
              <div className="tabular text-xl font-bold mt-1">$612</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Promedio $/hora</div>
              <div className="tabular text-xl font-bold mt-1">$5.730</div>
            </div>
          </div>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 px-1">
          {trips.length} viajes ofrecidos
        </div>

        <ul className="space-y-2">
          {trips.map((t, i) => (
            <TripRow key={i} trip={t} />
          ))}
        </ul>
      </div>
      <PrototypeNav />
    </div>
  );
}

function TripRow({ trip }: { trip: Trip }) {
  const toneBg = trip.tone === "go" ? "bg-go" : trip.tone === "warn" ? "bg-warn" : "bg-stop";
  return (
    <li className="rounded-xl border border-border bg-surface p-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      <span className={`h-3 w-3 rounded-full ${toneBg} shrink-0`} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="tabular text-lg font-bold">${trip.perKm}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">/km</span>
          <span className="tabular text-sm text-muted-foreground ml-auto">${trip.perHour.toLocaleString("es-AR")}<span className="text-[10px] ml-1">/h</span></span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground tabular">{trip.time}</div>
      </div>
      <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-md ${trip.accepted ? "text-go bg-go/10" : "text-muted-foreground bg-surface-2"}`}>
        {trip.accepted ? "Aceptado" : "Rechazado"}
      </span>
    </li>
  );
}
