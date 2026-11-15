import { CircleAlert, Clock, DoorOpen, Mail, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { treatments, type Treatment } from "./treatments";

// Small, static product mock-ups used in the "How it works" tour. Each one
// shows something the app really does today (keep them that way)

const week: { day: string; blocks: { top: number; h: number; type: Treatment }[] }[] = [
  { day: "Lun", blocks: [{ top: 4, h: 18, type: "physio" }, { top: 30, h: 14, type: "rehab" }, { top: 60, h: 20, type: "massage" }] },
  { day: "Mar", blocks: [{ top: 10, h: 22, type: "pilates" }, { top: 40, h: 16, type: "physio" }, { top: 70, h: 14, type: "rehab" }] },
  { day: "Mié", blocks: [{ top: 2, h: 14, type: "rehab" }, { top: 22, h: 20, type: "physio" }, { top: 56, h: 26, type: "physio" }] },
  { day: "Jue", blocks: [{ top: 16, h: 18, type: "massage" }, { top: 44, h: 22, type: "pilates" }] },
  { day: "Vie", blocks: [{ top: 6, h: 16, type: "physio" }, { top: 28, h: 14, type: "rehab" }, { top: 50, h: 18, type: "physio" }] },
];

// Agenda: the week, and the check that runs before saving an appointment
export function SchedulePreview() {
  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Laura · esta semana</span>
        <span className="text-xs text-muted-foreground">32 h reservadas</span>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {week.map((d, col) => (
          <div key={d.day} className="flex flex-col gap-2">
            <span className="text-center text-[11px] text-muted-foreground">{d.day}</span>
            <div className="relative h-56 rounded-lg bg-muted/60">
              {d.blocks.map((b, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute inset-x-1 rounded-md motion-safe:animate-rise",
                    treatments[b.type].className,
                  )}
                  style={{
                    top: `${b.top}%`,
                    height: `${b.h}%`,
                    animationDelay: `${col * 60 + i * 40}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed p-3 text-xs">
        <CircleAlert className="mt-px size-4 shrink-0 text-coral" />
        <span>
          <span className="font-medium">Laura ya tiene una cita a las 10:30.</span>{" "}
          <span className="text-muted-foreground">Elige otra hora u otro fisio.</span>
        </span>
      </div>
    </div>
  );
}

const services = [
  { name: "Fisioterapia", detail: "45 min · 45 €", type: "physio" as Treatment },
  { name: "Rehabilitación", detail: "60 min · 50 € · Gimnasio", type: "rehab" as Treatment },
  { name: "Pilates en grupo", detail: "55 min · hasta 6 pacientes", type: "pilates" as Treatment },
];

const openingHours = [
  { day: "Lun – Jue", hours: "09:00 – 14:00 · 16:00 – 20:30" },
  { day: "Viernes", hours: "09:00 – 15:00" },
  { day: "8 dic", hours: "Cerrado · festivo", closed: true },
];

// Configuración: services, opening hours and closures
export function SetupPreview() {
  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-lg">
      <span className="text-xs text-muted-foreground">Servicios</span>
      <div className="mt-2 flex flex-col gap-2">
        {services.map((s, i) => (
          <div
            key={s.name}
            className="flex items-center gap-3 rounded-xl border p-3 motion-safe:animate-rise"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className={cn("h-8 w-1.5 rounded-full", treatments[s.type].className)} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{s.name}</span>
              <span className="truncate text-xs text-muted-foreground">{s.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <span className="mt-5 block text-xs text-muted-foreground">Horario</span>
      <div className="mt-2 flex flex-col divide-y rounded-xl bg-muted/60 px-4">
        {openingHours.map((h) => (
          <div key={h.day} className="flex items-center justify-between gap-3 py-2.5 text-xs">
            <span className="flex items-center gap-2 font-medium">
              <Clock className="size-3.5 text-muted-foreground" /> {h.day}
            </span>
            <span className={cn(h.closed ? "font-medium text-coral" : "text-muted-foreground")}>
              {h.hours}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const people = [
  { initials: "LM", name: "Laura Martín", role: "Fisioterapeuta", className: "bg-sage" },
  { initials: "CR", name: "Carmen Ruiz", role: "Recepción", className: "bg-sand" },
  { initials: "IN", name: "Iván Navarro", role: "Administrador", className: "bg-sky" },
];

// Equipo: members with their role, and a pending invitation
export function TeamPreview() {
  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-4 text-primary" /> Equipo
        </span>
        <span className="text-xs text-muted-foreground">4 personas</span>
      </div>
      <div className="mt-4 flex flex-col divide-y">
        {people.map((p, i) => (
          <div
            key={p.name}
            className="flex items-center gap-3 py-3 motion-safe:animate-rise"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-xs font-medium",
                p.className,
              )}
            >
              {p.initials}
            </span>
            <span className="flex-1 text-sm font-medium">{p.name}</span>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs">{p.role}</span>
          </div>
        ))}
      </div>
      <div
        className="mt-3 flex items-center gap-3 rounded-xl border border-dashed p-3 text-xs motion-safe:animate-rise"
        style={{ animationDelay: "350ms" }}
      >
        <Mail className="size-4 shrink-0 text-coral" />
        <span className="flex-1">
          Invitación enviada a <span className="font-medium">marta@clinica.com</span>
        </span>
        <span className="text-muted-foreground">Fisio</span>
      </div>
    </div>
  );
}

const byService = [
  { name: "Fisioterapia", value: 142, type: "physio" as Treatment },
  { name: "Rehabilitación", value: 88, type: "rehab" as Treatment },
  { name: "Pilates en grupo", value: 54, type: "pilates" as Treatment },
  { name: "Masaje", value: 28, type: "massage" as Treatment },
];

// Informes: the month by service, with the headline numbers
export function ReportPreview() {
  const max = Math.max(...byService.map((s) => s.value));
  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-lg">
      <span className="text-xs text-muted-foreground">Noviembre</span>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[
          ["312", "citas"],
          ["268 h", "de sesión"],
          ["4 %", "ausencias"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-xl bg-muted/60 p-3">
            <span className="block text-xl font-medium tabular-nums">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <span className="mt-5 block text-xs text-muted-foreground">Por servicio</span>
      <div className="mt-3 flex flex-col gap-3">
        {byService.map((s, i) => (
          <div key={s.name} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", treatments[s.type].className)} />
                {s.name}
              </span>
              <span className="font-medium tabular-nums">{s.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full origin-left rounded-full bg-primary motion-safe:animate-rise"
                style={{ width: `${(s.value / max) * 100}%`, animationDelay: `${i * 80}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <DoorOpen className="size-3.5" /> También por fisio, y cruzado fisio × servicio
      </div>
    </div>
  );
}
