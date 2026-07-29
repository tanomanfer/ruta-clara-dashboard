import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import { Gauge, SlidersHorizontal, History, MapPin, Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { leadSchema, type LeadValues } from "@/lib/lead-schema";
import { supabase } from "@/lib/supabase";
import { SetupMockup, HomeMockup } from "@/components/landing/mockups";
import { SemaphoreShowcase } from "@/components/landing/SemaphoreShowcase";
import { Testimonials } from "@/components/landing/Testimonials";
import { WaitlistCount } from "@/components/landing/WaitlistCount";
import { Reveal } from "@/components/landing/Reveal";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/home" });
    }
  },
  head: () => ({
    meta: [
      { title: "Ruta Clara — Sabé si el viaje conviene. Y a dónde vas." },
      {
        name: "description",
        content:
          "El semáforo te dice si el precio vale la pena. El mapa te muestra la zona antes de aceptar. Sumate a la lista de espera.",
      },
      { property: "og:title", content: "Ruta Clara — Sabé si el viaje conviene. Y a dónde vas." },
      {
        property: "og:description",
        content: "Semáforo instantáneo, tus mínimos $/km y $/hora, zona a la vista antes de aceptar.",
      },
    ],
  }),
  component: Landing,
});

const NARROW = "max-w-md md:max-w-2xl mx-auto";
const WIDE = "max-w-md md:max-w-3xl lg:max-w-5xl mx-auto";

function Landing() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <SiteHeader />
      <Hero />
      <Benefits />
      <HowItWorks />
      <SemaphoreSection />
      <Screenshots />
      <TestimonialsSection />
      <About />
      <Waitlist />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className={`${WIDE} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg border border-border bg-surface grid place-items-center">
            <span className="tabular text-sm font-extrabold text-accent">RC</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">Ruta Clara</span>
        </div>
        <Link
          to="/login"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative px-5 pt-16 pb-16 md:pt-24 md:pb-24 hero-gradient overflow-hidden">
      <div className="absolute inset-0 bg-dot-grid opacity-[0.08] pointer-events-none" />
      <div className={`${NARROW} relative text-center animate-in fade-in slide-in-from-bottom-4 duration-700`}>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
          Para choferes de apps de viajes
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6 text-balance">
          Sabé si el viaje{" "}
          <span className="text-accent text-glow-accent">conviene</span>. Y{" "}
          <span className="text-go text-glow-go">a dónde vas</span>.
        </h1>
        <p className="text-muted-foreground/80 text-base md:text-lg leading-relaxed mb-9 max-w-md mx-auto">
          El semáforo te dice si el precio vale la pena. El mapa te muestra la zona antes de aceptar.
          Todo en dos segundos, sin sacar la mano del volante.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            to="/register"
            className={buttonVariants({
              size: "lg",
              className:
                "w-full max-w-xs text-base h-14 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_-8px_var(--accent)]",
            })}
          >
            Quiero probarla
          </Link>
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ya tengo cuenta · Iniciar sesión
          </Link>
        </div>
        <WaitlistCount />
      </div>
    </section>
  );
}

const benefits = [
  {
    icon: Gauge,
    title: "Semáforo instantáneo",
    description: "Verde, ámbar o rojo por cada viaje. Un vistazo y ya sabés qué te conviene.",
    tone: "go" as const,
  },
  {
    icon: SlidersHorizontal,
    title: "Tus propios mínimos",
    description: "Configurás cuánto necesitás ganar por kilómetro y por hora. La decisión es tuya.",
    tone: "accent" as const,
  },
  {
    icon: History,
    title: "Historial de tu día",
    description: "Cuántos viajes hiciste, cuánto ganaste y cómo viene tu promedio del día.",
    tone: "warn" as const,
  },
  {
    icon: MapPin,
    title: "Zona a la vista antes de aceptar",
    description:
      "Ves la zona de destino de un vistazo, para decidir con más información — no solo por la plata, también por seguridad.",
    tone: "stop" as const,
  },
];

const toneStyles = {
  go: { icon: "text-go", iconBg: "bg-go/10", border: "hover:border-go/50" },
  accent: { icon: "text-accent", iconBg: "bg-accent/10", border: "hover:border-accent/50" },
  warn: { icon: "text-warn", iconBg: "bg-warn/10", border: "hover:border-warn/50" },
  stop: { icon: "text-stop", iconBg: "bg-stop/10", border: "hover:border-stop/50" },
};

function Benefits() {
  return (
    <section className="px-5 py-16 md:py-20">
      <div className={WIDE}>
        <Reveal>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-10 md:mb-14">
            Todo lo que necesitás, de un vistazo
          </h2>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => {
            const t = toneStyles[b.tone];
            return (
              <Reveal key={b.title} delay={i * 100}>
                <div
                  className={`h-full rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 ${t.border}`}
                >
                  <div className={`h-14 w-14 rounded-xl ${t.iconBg} grid place-items-center mb-5`}>
                    <b.icon className={`h-10 w-10 ${t.icon}`} strokeWidth={1.75} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">{b.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    title: "Contanos tus mínimos",
    description: "Decinos cuánto querés ganar por kilómetro y por hora como mínimo.",
  },
  {
    title: "Recibí la señal",
    description: "Cada vez que te llega un viaje, Ruta Clara te dice si conviene o no.",
  },
  {
    title: "Decidís vos",
    description: "Aceptás con la información a mano, sin perder tiempo calculando.",
  },
] as const;

function HowItWorks() {
  return (
    <section className="px-5 py-16 md:py-20 bg-surface/40 border-y border-border">
      <div className={NARROW}>
        <Reveal>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-10 md:mb-14">Cómo funciona</h2>
        </Reveal>
        <div className="space-y-6">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 100}>
              <div className="flex gap-4 items-start">
                <div className="h-9 w-9 shrink-0 rounded-full bg-accent grid place-items-center">
                  <span className="tabular text-sm font-extrabold text-accent-foreground">{i + 1}</span>
                </div>
                <div className="min-w-0 pt-1">
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">{s.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function SemaphoreSection() {
  return (
    <section className="px-5 py-16 md:py-20">
      <div className={NARROW}>
        <Reveal>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-2">Así se ve la decisión</h2>
          <p className="text-sm text-muted-foreground/80 text-center mb-10 md:mb-14">
            Probá los tres estados del semáforo.
          </p>
        </Reveal>
        <Reveal delay={100}>
          <SemaphoreShowcase />
        </Reveal>
      </div>
    </section>
  );
}

function Screenshots() {
  return (
    <section className="px-5 py-16 md:py-20 bg-surface/40 border-y border-border">
      <div className={WIDE}>
        <Reveal>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-2">Así se ve por dentro</h2>
          <p className="text-sm text-muted-foreground/80 text-center mb-10 md:mb-14">
            Pantallas reales del prototipo, en desarrollo.
          </p>
        </Reveal>
        <div className="grid grid-cols-2 gap-6 max-w-md mx-auto md:max-w-lg">
          <Reveal>
            <div className="rounded-2xl border border-border bg-surface p-4 transition-transform duration-300 hover:-translate-y-1">
              <SetupMockup />
              <p className="mt-3 text-center text-xs text-muted-foreground">Tus objetivos</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="rounded-2xl border border-border bg-surface p-4 transition-transform duration-300 hover:-translate-y-1">
              <HomeMockup />
              <p className="mt-3 text-center text-xs text-muted-foreground">Tu día</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="px-5 py-16 md:py-20">
      <div className={WIDE}>
        <Reveal>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-10 md:mb-14">
            Lo que dicen los que ya la probaron
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <Testimonials />
        </Reveal>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="px-5 py-16 md:py-20 bg-surface/40 border-y border-border">
      <Reveal>
        <div className={`${NARROW} text-center`}>
          <h2 className="text-xl md:text-2xl font-bold mb-2">Hecho por choferes, para choferes</h2>
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            Ruta Clara nace de horas manejando y calculando a mano si valía la pena cada viaje. La
            construimos para que ese cálculo lo hagamos nosotros, no vos.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

function Waitlist() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<LeadValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { nombre: "", email: "", whatsapp: "" },
  });

  const onSubmit = async (values: LeadValues) => {
    const { error } = await supabase.from("leads").insert({
      nombre: values.nombre,
      email: values.email,
      whatsapp: values.whatsapp || null,
    });

    if (error) {
      toast.error("No pudimos guardar tu contacto", { description: error.message });
      return;
    }

    toast.success("Listo, te avisamos apenas esté lista");
    form.reset();
    setSubmitted(true);
  };

  return (
    <section className="px-5 py-16 md:py-20">
      <Reveal>
        <div className={NARROW}>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-2">Sumate a la lista de espera</h2>
          <p className="text-sm text-muted-foreground/80 text-center mb-10 leading-relaxed">
            Todavía en pruebas privadas. Dejanos tu contacto y te avisamos cuando esté lista para vos.
          </p>

          <div className="rounded-3xl border border-accent/30 bg-surface glow-accent-ring p-6 md:p-10">
            {submitted ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-go/15 border border-go/40 grid place-items-center shadow-[0_0_40px_-8px_var(--go)]">
                  <Check className="h-8 w-8 text-go" strokeWidth={3} />
                </div>
                <p className="text-lg font-semibold mb-1">Listo, te avisamos apenas esté lista</p>
                <p className="text-sm text-muted-foreground/80">Gracias por sumarte a Ruta Clara.</p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input autoComplete="name" placeholder="Tu nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" placeholder="vos@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp (opcional)</FormLabel>
                        <FormControl>
                          <Input type="tel" autoComplete="tel" placeholder="11 2345 6789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_-8px_var(--accent)]"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Enviando..." : "Quiero que me avisen"}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="px-5 py-12 border-t border-border">
      <div className={`${WIDE} flex flex-col items-center gap-4 text-center`}>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg border border-border bg-surface grid place-items-center">
            <span className="tabular text-xs font-extrabold text-accent">RC</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">Ruta Clara</span>
        </div>
        <Link to="/faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Preguntas frecuentes
        </Link>
        <p className="max-w-md text-xs text-muted-foreground/70 leading-relaxed">
          Actualmente en fase beta con choferes seleccionados. Sin costo durante el período de prueba.
        </p>
        <p className="text-[11px] text-muted-foreground/50">
          © {new Date().getFullYear()} Ruta Clara
        </p>
      </div>
    </footer>
  );
}
