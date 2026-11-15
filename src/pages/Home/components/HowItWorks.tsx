import { useState } from "react";
import { cn } from "@/lib/utils";
import { ReportPreview, SchedulePreview, SetupPreview, TeamPreview } from "./previews";

const STEP_DURATION = 7000; // ms each step stays on screen

// Only what the app does today (Reservas, Configuración, Equipo, Informes)
const steps = [
  {
    verb: "Configura",
    title: "Tu clínica, tal y como funciona",
    description:
      "Define tus servicios con su duración, precio y color, tus salas y su capacidad, el horario de apertura y los días que cierras. Lo haces una vez y la agenda lo respeta siempre.",
    Preview: SetupPreview,
  },
  {
    verb: "Invita",
    title: "Cada persona con su papel",
    description:
      "Añade a tu equipo por email. Fisioterapeutas, recepción y administradores ven y hacen solo lo que les corresponde.",
    Preview: TeamPreview,
  },
  {
    verb: "Organiza",
    title: "Todo el equipo en una sola agenda",
    description:
      "Cada fisio, sala y servicio en la misma vista, por día o por semana. Si una cita choca con otra, no cabe en la sala o queda fuera de horario, Kineflow te avisa antes de guardarla.",
    Preview: SchedulePreview,
  },
  {
    verb: "Mide",
    title: "El mes de un vistazo",
    description:
      "Citas, horas de sesión, pacientes y ausencias de cada mes, por servicio y por fisio. Sin exportar nada.",
    Preview: ReportPreview,
  },
];

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const { Preview } = steps[active];

  return (
    <section
      id="how"
      className="mx-auto max-w-6xl scroll-mt-24 px-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex max-w-2xl flex-col gap-4">
        <span className="text-sm font-medium text-coral">Cómo funciona</span>
        <h2 className="font-display text-5xl leading-[1.02] tracking-tight text-balance md:text-6xl">
          De la configuración a la primera cita.
        </h2>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <ol className="flex flex-col">
          {steps.map((step, i) => {
            const isActive = i === active;
            return (
              <li key={step.verb} className="border-t last:border-b">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={isActive}
                  className="group relative flex w-full flex-col gap-2 py-6 text-left"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="font-display text-lg text-muted-foreground tabular-nums">
                      0{i + 1}
                    </span>
                    <span
                      className={cn(
                        "font-display text-3xl tracking-tight transition-colors md:text-4xl",
                        isActive ? "text-foreground" : "text-muted-foreground/60 group-hover:text-foreground",
                      )}
                    >
                      {step.verb}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "grid pl-9 transition-all duration-500",
                      isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <span className="overflow-hidden">
                      <span className="block font-medium">{step.title}</span>
                      <span className="mt-1 block text-muted-foreground">{step.description}</span>
                    </span>
                  </span>

                  {/* Progress bar: when it fills up, move to the next step */}
                  {isActive && (
                    <span className="absolute inset-x-0 -top-px h-px origin-left bg-foreground motion-safe:animate-fill motion-reduce:hidden"
                      style={{
                        animationDuration: `${STEP_DURATION}ms`,
                        animationPlayState: paused ? "paused" : "running",
                      }}
                      onAnimationEnd={() => setActive((a) => (a + 1) % steps.length)}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="relative flex min-h-[30rem] items-center justify-center overflow-hidden rounded-[2rem] bg-secondary p-6 sm:p-10">
          <div
            className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-sand blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-sage blur-3xl"
            aria-hidden
          />
          <div key={active} className="relative flex w-full justify-center motion-safe:animate-rise" aria-hidden>
            <Preview />
          </div>
        </div>
      </div>
    </section>
  );
}
