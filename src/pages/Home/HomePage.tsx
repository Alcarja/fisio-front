import { ArrowRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import CtaBand from "@/components/CtaBand";
import HeroPreview from "./components/HeroPreview";
import HowItWorks from "./components/HowItWorks";
import FeatureBento from "./components/FeatureBento";

export default function HomePage() {
  return (
    <div className="space-y-28 md:space-y-36">
      <section className="relative isolate">
        {/* Soft background glow */}
        <div className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[36rem] overflow-hidden" aria-hidden>
          <div className="absolute top-0 left-1/2 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--sage),transparent)] opacity-70" />
          <div className="absolute top-24 left-[65%] h-72 w-[30rem] rounded-full bg-[radial-gradient(closest-side,var(--sand),transparent)] opacity-80" />
        </div>

        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 pt-16 text-center md:pt-24">
          <span className="flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur motion-safe:animate-rise">
            <span className="size-1.5 rounded-full bg-coral" />
            Software para clínicas de fisioterapia
          </span>

          <h1
            className="mt-6 font-display text-6xl leading-[0.95] tracking-tight text-balance motion-safe:animate-rise sm:text-7xl md:text-8xl"
            style={{ animationDelay: "80ms" }}
          >
            Menos papeleo.
            <br />
            Más{" "}
            <span className="relative inline-block italic">
              movimiento.
              <svg
                viewBox="0 0 300 20"
                preserveAspectRatio="none"
                className="absolute -bottom-2 left-0 h-3 w-full md:-bottom-3 md:h-4"
                aria-hidden
              >
                <path
                  d="M4 14 C 60 4, 120 4, 170 10 S 260 16, 296 6"
                  fill="none"
                  strokeWidth="5"
                  strokeLinecap="round"
                  pathLength={1}
                  className="stroke-coral [stroke-dasharray:1] motion-safe:animate-draw [animation-delay:700ms] [animation-fill-mode:both]"
                />
              </svg>
            </span>
          </h1>

          <p
            className="mt-8 max-w-xl text-lg text-muted-foreground text-pretty motion-safe:animate-rise md:text-xl"
            style={{ animationDelay: "160ms" }}
          >
            Fisio reúne la agenda de tu equipo, las historias clínicas y los
            recordatorios en un solo lugar, para que cada hora sea para tus pacientes.
          </p>

          <div
            className="mt-10 flex flex-col items-center gap-3 motion-safe:animate-rise sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <Button size="lg" className="h-12 rounded-full px-6 text-base">
              Empieza gratis <ArrowRight />
            </Button>
            <Button size="lg" variant="ghost" className="h-12 rounded-full px-6 text-base" asChild>
              <a href="#how">
                Descubre cómo funciona <ArrowDown />
              </a>
            </Button>
          </div>
          <span
            className="mt-4 text-xs text-muted-foreground motion-safe:animate-rise"
            style={{ animationDelay: "300ms" }}
          >
            Sin tarjeta de crédito · Listo en una tarde
          </span>
        </div>

        <div
          className="mx-auto mt-16 max-w-6xl px-5 motion-safe:animate-rise md:mt-20"
          style={{ animationDelay: "400ms" }}
        >
          <HeroPreview />
        </div>
      </section>

      <HowItWorks />
      <FeatureBento />
      <CtaBand />
    </div>
  );
}
