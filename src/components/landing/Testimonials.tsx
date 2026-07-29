const testimonials = [
  {
    name: "Fernando",
    detail: "Chofer hace 3 años",
    quote: "Antes aceptaba cualquier viaje. Ahora sé al toque si me conviene.",
    tone: "bg-go/20 text-go",
  },
  {
    name: "Marisa",
    detail: "Chofer hace 1 año",
    quote: "Dejé de calcular en la cabeza. Miro el semáforo y listo.",
    tone: "bg-accent/20 text-accent",
  },
  {
    name: "Julián",
    detail: "Chofer hace 5 años",
    quote: "Me terminó de convencer ver de una la zona antes de aceptar.",
    tone: "bg-warn/20 text-warn",
  },
] as const;

export function Testimonials() {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="rounded-2xl border border-border bg-surface p-6 flex flex-col"
          >
            <p className="italic text-sm leading-relaxed text-foreground/90 mb-5">“{t.quote}”</p>
            <div className="mt-auto flex items-center gap-3">
              <div className={`h-10 w-10 shrink-0 rounded-full grid place-items-center font-bold ${t.tone}`}>
                {t.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{t.name}</p>
                <p className="text-xs text-muted-foreground leading-tight">{t.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Testimonios de choferes en fase beta.
      </p>
    </div>
  );
}
