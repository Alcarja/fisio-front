import { ChevronLeft, ChevronRight, CircleAlert, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { treatments, type Treatment } from "./treatments";

// Sample day shown in the hero. Times are minutes from midnight.
type Appointment = {
  patient: string;
  start: number;
  duration: number;
  type: Treatment | "open";
  note?: string;
};

const DAY_START = 8 * 60;
const DAY_END = 14 * 60;
const HOUR_HEIGHT = 60; // px
const NOW = 10 * 60 + 40;

const team: { name: string; initials: string; appointments: Appointment[] }[] = [
  {
    name: "Laura",
    initials: "LM",
    appointments: [
      { patient: "Ana Morales", start: 480, duration: 60, type: "rehab" },
      { patient: "Jorge Pérez", start: 555, duration: 45, type: "physio" },
      { patient: "Lucía Fernández", start: 615, duration: 60, type: "physio", note: "Confirmada" },
      { patient: "Elena Ruiz", start: 720, duration: 60, type: "massage" },
    ],
  },
  {
    name: "Carlos",
    initials: "CR",
    appointments: [
      { patient: "Pablo Díaz", start: 510, duration: 60, type: "physio" },
      { patient: "Pilates en grupo", start: 600, duration: 60, type: "pilates", note: "4 pacientes" },
      { patient: "Sara Gil", start: 690, duration: 45, type: "rehab" },
      { patient: "Marcos León", start: 780, duration: 60, type: "physio" },
    ],
  },
  {
    name: "Marta",
    initials: "MS",
    appointments: [
      { patient: "Inés Torres", start: 540, duration: 90, type: "rehab" },
      { patient: "Diego Sanz", start: 660, duration: 45, type: "massage" },
      { patient: "Hueco libre", start: 750, duration: 60, type: "open" },
    ],
  },
  {
    name: "Iván",
    initials: "IN",
    appointments: [
      { patient: "Raúl Vega", start: 480, duration: 45, type: "physio" },
      { patient: "Clara Ortiz", start: 570, duration: 60, type: "pilates" },
      { patient: "Hugo Navarro", start: 660, duration: 90, type: "rehab" },
    ],
  },
];

const hours = Array.from(
  { length: (DAY_END - DAY_START) / 60 },
  (_, i) => DAY_START / 60 + i,
);

const toY = (minutes: number) => ((minutes - DAY_START) / 60) * HOUR_HEIGHT;
const fmt = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// Hide columns on small screens so the calendar stays readable
const columnVisibility = ["flex", "flex", "hidden sm:flex", "hidden md:flex"];

export default function HeroPreview() {
  return (
    <div className="relative">
      <div
        className="overflow-hidden rounded-[1.75rem] border bg-card shadow-[0_2px_4px_rgb(0_0_0/0.03),0_40px_80px_-30px_rgb(20_60_50/0.35)]"
        aria-hidden
      >
        {/* Window toolbar */}
        <div className="flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="hidden gap-1.5 sm:flex">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <ChevronLeft className="size-4" />
              <ChevronRight className="size-4" />
            </div>
            <span className="text-sm font-medium">Martes, 12 de marzo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden rounded-full bg-muted p-0.5 text-xs sm:flex">
              <span className="rounded-full bg-card px-3 py-1 font-medium shadow-sm">Día</span>
              <span className="px-3 py-1 text-muted-foreground">Semana</span>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              <Plus className="size-3.5" /> <span className="hidden sm:inline">Cita</span>
            </span>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden w-48 shrink-0 flex-col gap-6 border-r p-5 lg:flex">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Hoy</span>
              <span className="font-display text-4xl leading-none">14</span>
              <span className="text-xs text-muted-foreground">citas · 1 hueco libre</span>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-xs text-muted-foreground">Tratamientos</span>
              {Object.values(treatments).map((t) => (
                <span key={t.label} className="flex items-center gap-2 text-xs">
                  <span className={cn("size-2.5 rounded-full", t.className)} />
                  {t.label}
                </span>
              ))}
            </div>
          </aside>

          {/* Calendar */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex border-b">
              <div className="w-12 shrink-0" />
              <div className="grid flex-1 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {team.map((member, i) => (
                  <div
                    key={member.name}
                    className={cn("items-center gap-2 border-l px-3 py-2.5", columnVisibility[i])}
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-[10px] font-medium">
                      {member.initials}
                    </span>
                    <span className="text-xs font-medium">{member.name}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {member.appointments.filter((a) => a.type !== "open").length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex" style={{ height: hours.length * HOUR_HEIGHT }}>
              {/* Hour labels */}
              <div className="w-12 shrink-0">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="pr-2 text-right text-[10px] text-muted-foreground"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    <span className="relative -top-1.5">{h === 8 ? "" : `${h}:00`}</span>
                  </div>
                ))}
              </div>

              <div className="relative grid flex-1 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {/* Hour lines */}
                <div className="pointer-events-none absolute inset-0">
                  {hours.slice(1).map((h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-dashed"
                      style={{ top: toY(h * 60) }}
                    />
                  ))}
                </div>

                {team.map((member, col) => (
                  <div key={member.name} className={cn("relative border-l", columnVisibility[col])}>
                    {member.appointments.map((a, i) => {
                      const isNow = a.start <= NOW && NOW < a.start + a.duration;
                      return (
                        <div
                          key={a.patient}
                          className={cn(
                            "absolute inset-x-1 flex flex-col overflow-hidden rounded-lg px-2 py-1.5 motion-safe:animate-rise",
                            a.type === "open"
                              ? "border border-dashed border-foreground/20 text-muted-foreground"
                              : treatments[a.type].className,
                            isNow && "ring-2 ring-coral ring-offset-1 ring-offset-card",
                          )}
                          style={{
                            top: toY(a.start) + 2,
                            height: (a.duration / 60) * HOUR_HEIGHT - 4,
                            animationDelay: `${300 + col * 120 + i * 70}ms`,
                          }}
                        >
                          <span className="truncate text-xs font-medium">{a.patient}</span>
                          <span className="truncate text-[10px] opacity-70">
                            {fmt(a.start)} · {a.note ?? (a.type === "open" ? "Disponible" : treatments[a.type].label)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Current time */}
                <div
                  className="pointer-events-none absolute inset-x-0 flex items-center"
                  style={{ top: toY(NOW) }}
                >
                  <span className="-ml-1 size-2 rounded-full bg-coral motion-safe:animate-pulse-ring" />
                  <span className="h-px flex-1 bg-coral" />
                </div>
              </div>

              <span
                className="absolute left-1 -translate-y-1/2 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-medium text-white"
                style={{ top: toY(NOW) }}
              >
                {fmt(NOW)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <div
        className="absolute bottom-6 -left-10 hidden w-64 rounded-2xl border bg-card/95 p-4 shadow-xl backdrop-blur motion-safe:animate-rise xl:block"
        style={{ animationDelay: "1100ms" }}
        aria-hidden
      >
        <div className="motion-safe:animate-float">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex size-5 items-center justify-center rounded-full bg-sand">
              <CircleAlert className="size-3 text-coral" />
            </span>
            Antes de guardar
          </div>
          <p className="mt-2 text-sm">
            <span className="font-medium">Carlos</span> ya tiene una cita a las 10:00. Elige otra
            hora u otro fisio.
          </p>
        </div>
      </div>

      <div
        className="absolute -right-10 -bottom-12 hidden w-60 rounded-2xl border bg-card/95 p-4 shadow-xl backdrop-blur motion-safe:animate-rise xl:block"
        style={{ animationDelay: "1400ms" }}
        aria-hidden
      >
        <div className="motion-safe:animate-float [animation-delay:-3s]">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Informe · noviembre</span>
            <span className="font-medium text-primary">4 % ausencias</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-4xl leading-none">312</span>
            <span className="text-xs text-muted-foreground">citas este mes</span>
          </div>
          <div className="mt-3 flex h-12 items-end gap-2">
            {[
              ["Laura", 96],
              ["Carlos", 84],
              ["Marta", 71],
              ["Iván", 61],
            ].map(([name, v]) => (
              <span
                key={name}
                title={`${name}: ${v}`}
                className="flex-1 rounded-t-md bg-primary/80"
                style={{ height: `${(Number(v) / 96) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
