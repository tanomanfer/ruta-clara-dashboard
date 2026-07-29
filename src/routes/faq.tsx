import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [{ title: "Ruta Clara — Preguntas frecuentes" }],
  }),
  component: Faq,
});

function Faq() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <h1 className="text-3xl font-bold mb-3">Preguntas frecuentes</h1>
      <p className="text-muted-foreground mb-8">Próximamente.</p>
      <Link to="/" className="text-sm text-accent font-medium hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}
