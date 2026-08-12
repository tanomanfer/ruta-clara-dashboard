import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/bienvenida")({
    head: () => ({
        meta: [
            { title: "¡Listo! Tu lugar quedó reservado — Ruta Clara" },
            {
                name: "description",
                content: "Gracias por sumarte a Ruta Clara. Te avisamos apenas esté lista.",
            },
        ],
    }),
    component: Bienvenida,
});

function Bienvenida() {
    return (
        <div className="min-h-screen grid place-items-center px-5 hero-gradient overflow-hidden relative">
            <div className="absolute inset-0 bg-dot-grid opacity-[0.08] pointer-events-none" />

            <div className="relative text-center max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mx-auto mb-8 h-20 w-20 rounded-full bg-go/15 border border-go/40 grid place-items-center shadow-[0_0_50px_-8px_var(--go)]">
                    <Check className="h-10 w-10 text-go" strokeWidth={3} />
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-5 text-balance">
                    ¡Listo! Tu lugar quedó{" "}
                    <span className="text-go text-glow-go">reservado</span>
                </h1>

                <p className="text-muted-foreground/80 text-base md:text-lg leading-relaxed mb-4">
                    Ya estás en la lista de los primeros choferes. Si entrás entre los primeros 50,
                    tenés el primer mes 100% gratis.
                </p>

                <p className="text-muted-foreground/80 text-base leading-relaxed mb-10">
                    Te avisamos por mail apenas Ruta Clara esté lista para vos. Revisá tu casilla
                    (y la carpeta de spam, por las dudas).
                </p>

                <Link
                    to="/"
                    className={buttonVariants({
                        size: "lg",
                        className: "h-13 rounded-xl px-8",
                    })}
                >
                    Volver al inicio
                </Link>

                <div className="mt-12 flex items-center justify-center gap-2 opacity-70">
                    <div className="h-6 w-6 rounded-md border border-border bg-surface grid place-items-center">
                        <span className="tabular text-[10px] font-extrabold text-accent">RC</span>
                    </div>
                    <span className="text-xs font-semibold tracking-tight">Ruta Clara</span>
                </div>
            </div>
        </div>
    );
}