import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-5">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-primary-foreground sm:px-12 md:py-24">
        {/* Concentric rings, like ripples of movement */}
        <svg
          viewBox="0 0 400 400"
          className="absolute -top-24 -right-24 -z-10 size-[28rem]"
          aria-hidden
        >
          {[60, 100, 140, 180].map((r) => (
            <circle
              key={r}
              cx="200"
              cy="200"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="1"
            />
          ))}
          <circle cx="200" cy="200" r="10" className="fill-coral" />
        </svg>

        <div className="flex max-w-2xl flex-col gap-6">
          <h2 className="font-display text-5xl leading-[1.02] tracking-tight text-balance md:text-7xl">
            Devuélvele el <em className="text-coral">tiempo</em> a tu clínica.
          </h2>
          <p className="max-w-lg text-lg text-primary-foreground/75">
            Da de alta a tu equipo, abre tu agenda y cita a tu primer paciente
            esta misma tarde.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="h-12 rounded-full bg-primary-foreground px-6 text-primary hover:bg-primary-foreground/90"
            >
              Empieza gratis <ArrowRight />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-12 rounded-full px-6 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              Habla con nosotros
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
