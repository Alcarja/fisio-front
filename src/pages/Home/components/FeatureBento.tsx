import type { ReactNode } from "react";
import { Bell, BellOff, Check, ClipboardList, Lock, QrCode, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

function Tile({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex flex-col justify-between gap-8 overflow-hidden rounded-[1.75rem] border bg-card p-6 transition-shadow hover:shadow-[0_24px_48px_-24px_rgb(20_60_50/0.25)]",
        className,
      )}
    >
      <div className="flex flex-1 items-center justify-center">{children}</div>
      <div className="flex flex-col gap-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Informes: appointments of the month per physio
function MonthlyByPhysio() {
  const physios = [
    { name: "Laura", v: 96 },
    { name: "Carlos", v: 84 },
    { name: "Marta", v: 71 },
    { name: "Iván", v: 61 },
  ];
  const max = Math.max(...physios.map((p) => p.v));
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-5xl leading-none">312</span>
        <span className="text-sm text-muted-foreground">citas en noviembre · 4 % ausencias</span>
      </div>
      <div className="flex h-32 items-end gap-3">
        {physios.map(({ name, v }) => (
          <div key={name} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-[11px] font-medium tabular-nums">{v}</span>
            <div className="flex h-20 w-full items-end">
              <div
                className="w-full origin-bottom rounded-t-lg bg-primary/80 transition-transform duration-500 group-hover:scale-y-105"
                style={{ height: `${(v / max) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Group sessions: places taken out of the service's maximum
function GroupClass() {
  const taken = 4;
  const places = 6;
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">Pilates · 18:00</span>
        <span className="font-display text-3xl leading-none">
          {taken}
          <span className="text-muted-foreground">/{places}</span>
        </span>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {Array.from({ length: places }, (_, i) => (
          <span
            key={i}
            className={cn(
              "aspect-square rounded-full transition-transform duration-300 group-hover:scale-110",
              i < taken ? "bg-lilac" : "border-2 border-dashed border-border",
            )}
            style={{ transitionDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">Quedan 2 plazas · Sala polivalente</span>
    </div>
  );
}

// Appointment statuses
function Statuses() {
  const statuses = [
    { label: "Reservada", className: "bg-muted" },
    { label: "Confirmada", className: "bg-sky" },
    { label: "Completada", className: "bg-sage" },
    { label: "No se presentó", className: "bg-sand" },
  ];
  return (
    <div className="flex w-full max-w-[15rem] flex-col gap-2">
      {statuses.map((s, i) => (
        <span
          key={s.label}
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-transform duration-300 group-hover:translate-x-1",
            s.className,
          )}
          style={{ transitionDelay: `${i * 40}ms` }}
        >
          <Check className="size-3.5" /> {s.label}
        </span>
      ))}
      <span className="flex items-center gap-2 rounded-full border border-dashed px-3 py-1.5 text-xs text-muted-foreground">
        Cancelada · «Gripe, la mueve a la semana que viene»
      </span>
    </div>
  );
}

// Opening hours with a closed day
function OpeningWeek() {
  const days = [
    { d: "L", ranges: [[0, 45], [60, 100]] },
    { d: "M", ranges: [[0, 45], [60, 100]] },
    { d: "X", ranges: [] },
    { d: "J", ranges: [[0, 45], [60, 100]] },
    { d: "V", ranges: [[0, 60]] },
  ];
  return (
    <div className="flex w-full max-w-[15rem] flex-col gap-3">
      <div className="flex h-32 gap-2">
        {days.map((day) => (
          <div key={day.d} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative w-full flex-1 rounded-md bg-muted/60">
              {day.ranges.length === 0 ? (
                <span className="absolute inset-0 rounded-md border-2 border-dashed border-coral/60" />
              ) : (
                day.ranges.map(([from, to]) => (
                  <span
                    key={from}
                    className="absolute inset-x-0.5 rounded-sm bg-primary/70"
                    style={{ top: `${from}%`, height: `${to - from}%` }}
                  />
                ))
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">{day.d}</span>
          </div>
        ))}
      </div>
      <span className="text-xs">
        <span className="font-medium text-coral">Miércoles 8 cerrado</span>
        <span className="text-muted-foreground"> · festivo</span>
      </span>
    </div>
  );
}

// Several clinics, one account
function ClinicSwitch() {
  const clinics = [
    { initials: "MV", name: "Clínica Movimiento", role: "Propietario", active: true, className: "bg-sage" },
    { initials: "KN", name: "Centro Kine Norte", role: "Fisioterapeuta", active: false, className: "bg-sky" },
  ];
  return (
    <div className="flex w-full max-w-[15rem] flex-col gap-2">
      {clinics.map((c) => (
        <div
          key={c.name}
          className={cn(
            "flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
            c.active ? "bg-background shadow-sm" : "group-hover:bg-background",
          )}
        >
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-[11px] font-medium",
              c.className,
            )}
          >
            {c.initials}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-medium">{c.name}</span>
            <span className="text-[11px] text-muted-foreground">{c.role}</span>
          </div>
          {c.active && <span className="size-1.5 rounded-full bg-coral" />}
        </div>
      ))}
    </div>
  );
}

function Team() {
  const people = [
    { i: "LM", c: "bg-sage" },
    { i: "CR", c: "bg-sand" },
    { i: "MS", c: "bg-sky" },
    { i: "IN", c: "bg-lilac" },
  ];
  const rooms = [
    { name: "Sala 1", busy: [0, 1, 1, 0, 1, 1, 1, 0] },
    { name: "Sala 2", busy: [1, 1, 0, 0, 1, 0, 1, 1] },
    { name: "Gimnasio", busy: [0, 0, 1, 1, 1, 1, 0, 0] },
  ];
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <div className="flex -space-x-2">
        {people.map((p) => (
          <span
            key={p.i}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border-2 border-card text-xs font-medium transition-transform group-hover:-translate-y-0.5",
              p.c,
            )}
          >
            {p.i}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {rooms.map((r) => (
          <div key={r.name} className="flex items-center gap-3">
            <span className="w-14 text-xs text-muted-foreground">{r.name}</span>
            <div className="grid flex-1 grid-cols-8 gap-0.5">
              {r.busy.map((b, i) => (
                <span key={i} className={cn("h-3 rounded-sm", b ? "bg-primary/70" : "bg-muted")} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Historia clínica: one expediente with its pain trend and evolution
function ClinicalCase() {
  const notes = [
    { date: "4 nov", pain: 7, text: "Valoración. Dolor al elevar el brazo." },
    { date: "11 nov", pain: 5, text: "Mejor movilidad. Ejercicios en casa." },
    { date: "18 nov", pain: 3, text: "Casi sin dolor al final del rango." },
  ];
  const painClass = (level: number) =>
    level <= 3
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      : level <= 6
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        : "bg-red-500/15 text-red-700 dark:text-red-400";
  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Tendinopatía del supraespinoso</span>
          <span className="w-fit rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
            Hombro · derecho
          </span>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          Dolor
          <span className={cn("rounded-full px-1.5 py-0.5 font-medium tabular-nums", painClass(7))}>7</span>→
          <span className={cn("rounded-full px-1.5 py-0.5 font-medium tabular-nums", painClass(3))}>3</span>
        </span>
      </div>
      <ol className="flex flex-col">
        {notes.map((n, i) => (
          <li
            key={n.date}
            className="relative border-l py-1.5 pl-4 text-xs transition-transform duration-300 before:absolute before:top-3 before:-left-[4.5px] before:size-2 before:rounded-full before:bg-border group-hover:translate-x-0.5"
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <span className="font-medium">{n.date}</span>
            <span className={cn("ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium", painClass(n.pain))}>
              {n.pain}
            </span>
            <p className="mt-0.5 text-muted-foreground">{n.text}</p>
          </li>
        ))}
      </ol>
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="size-3" /> Cifrada · solo la ve el personal clínico
      </span>
    </div>
  );
}

// Reserva online: a QR on the counter and the free times
function OnlineBooking() {
  // A decorative pattern, not a real code
  const cells = Array.from({ length: 49 }, (_, i) => {
    const r = Math.floor(i / 7);
    const c = i % 7;
    const corner = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
    return corner || ((r + 1) * 31 + (c + 1) * 17 + r * c * 7) % 3 !== 0;
  });
  const slots = ["09:30", "10:00", "11:30", "12:00", "17:00", "18:30"];
  return (
    <div className="flex w-full max-w-[15rem] flex-col items-center gap-4">
      <div className="grid size-24 grid-cols-7 gap-0.5 rounded-xl border bg-background p-2 shadow-sm">
        {cells.map((on, i) => (
          <span key={i} className={cn("rounded-[2px]", on ? "bg-foreground" : "bg-transparent")} />
        ))}
      </div>
      <div className="grid w-full grid-cols-3 gap-1.5">
        {slots.map((t, i) => (
          <span
            key={t}
            className={cn(
              "rounded-full border py-1 text-center text-[11px] tabular-nums transition-colors",
              i === 1 ? "border-primary bg-primary text-primary-foreground" : "bg-background group-hover:border-primary/30",
            )}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// Recordatorios: the email the patient gets, and the mark when there's no email
function Reminder() {
  return (
    <div className="flex w-full max-w-[15rem] flex-col gap-2">
      <div className="flex flex-col gap-1.5 rounded-xl border bg-background p-3 shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
          <Bell className="size-3" /> Recordatorio
        </span>
        <span className="text-xs font-medium">Te esperamos mañana a las 10:00</span>
        <span className="text-[11px] text-muted-foreground">Con Laura · Clínica Movimiento</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-[11px] text-muted-foreground">
        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
          <BellOff className="size-2.5" />
        </span>
        Carlos Ruiz · falta su email
      </div>
    </div>
  );
}

// Ejercicios para casa: the physio's tabla, and what the patient sees on their phone
function HomeExercises() {
  const items = [
    { name: "Puente de glúteo", dose: "3 × 12" },
    { name: "Gato-camello", dose: "2 × 10" },
    { name: "Plancha lateral", dose: "3 × 15 s · cada lado" },
  ];
  return (
    <div className="flex w-full max-w-lg items-center justify-center gap-4">
      <div className="hidden w-48 flex-col gap-2 rounded-2xl border bg-background p-3 shadow-sm sm:flex">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
          <ClipboardList className="size-3" /> Tabla · Lumbar fase 1
        </span>
        {items.map((i) => (
          <span key={i.name} className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-2 py-1.5 text-[11px]">
            <span className="truncate">{i.name}</span>
            <span className="shrink-0 text-muted-foreground">{i.dose.split(" ·")[0]}</span>
          </span>
        ))}
        <span className="mt-1 flex items-center gap-1.5 self-start rounded-full bg-primary px-2.5 py-1 text-[11px] text-primary-foreground">
          <QrCode className="size-3" /> Enseñar al paciente
        </span>
      </div>
      <div className="w-44 rounded-[1.75rem] border-4 border-foreground/80 bg-background p-3 shadow-md transition-transform duration-300 group-hover:-translate-y-1">
        <span className="text-[9px] font-medium text-coral">Clínica Movimiento</span>
        <span className="mt-0.5 block font-display text-xl leading-none">Tus ejercicios</span>
        <div className="mt-2.5 flex flex-col gap-1.5">
          {items.map((i, n) => (
            <div key={i.name} className="flex items-center gap-2 rounded-xl border p-1.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
                {n + 1}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[10px] font-medium">{i.name}</span>
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <Repeat className="size-2.5" /> {i.dose}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeatureBento() {
  return (
    <section className="mx-auto max-w-6xl px-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex max-w-2xl flex-col gap-4">
          <span className="text-sm font-medium text-coral">Todo en su sitio</span>
          <h2 className="font-display text-5xl leading-[1.02] tracking-tight text-balance md:text-6xl">
            Los detalles, resueltos.
          </h2>
        </div>
        <p className="max-w-sm text-muted-foreground">
          De la agenda a la historia clínica: todo lo que necesita una clínica, en el mismo sitio.
        </p>
      </div>

      <div className="mt-12 grid auto-rows-[minmax(18rem,auto)] gap-4 md:grid-cols-3">
        <Tile
          className="md:col-span-2"
          title="Historia clínica de cada paciente"
          description="Un expediente por lesión, con valoración, plan y una nota por sesión. El dolor de cada visita se ve de un vistazo, y recepción solo ve los datos de contacto."
        >
          <ClinicalCase />
        </Tile>
        <Tile
          title="Reserva online con QR"
          description="Tus pacientes piden cita desde un enlace o un QR en el mostrador, solo en las horas que tú decides. Y la cancelan solos si no pueden venir."
        >
          <OnlineBooking />
        </Tile>
        <Tile
          title="Recordatorios de cita"
          description="Un email antes de cada cita, en nombre de tu clínica. La agenda te marca a quién no le llegará porque falta su email."
        >
          <Reminder />
        </Tile>
        <Tile
          className="md:col-span-2"
          title="Ejercicios para casa"
          description="Prepara tablas con tu banco de ejercicios o el de Kineflow y páutalas desde el expediente, ajustadas a cada paciente. Lo ve en su móvil escaneando un QR antes de irse, o en una hoja impresa."
        >
          <HomeExercises />
        </Tile>
        <Tile
          className="md:col-span-2"
          title="Informes que se entienden"
          description="Citas, horas de sesión, pacientes y ausencias de cada mes, por fisio y por servicio. Sin exportar ni una hoja de cálculo."
        >
          <MonthlyByPhysio />
        </Tile>
        <Tile
          title="Sesiones en grupo"
          description="Pilates o escuela de espalda con plazas limitadas. Nunca más pacientes de los que caben en el servicio o en la sala."
        >
          <GroupClass />
        </Tile>
        <Tile
          title="El estado de cada cita"
          description="Reservada, confirmada, completada o ausencia. Las cancelaciones guardan su motivo."
        >
          <Statuses />
        </Tile>
        <Tile
          title="Horario y festivos"
          description="Varios tramos al día, y cierres u horarios especiales para fechas concretas."
        >
          <OpeningWeek />
        </Tile>
        <Tile
          title="Varias clínicas, una cuenta"
          description="Si trabajas en más de una clínica, cambias de una a otra sin cerrar sesión."
        >
          <ClinicSwitch />
        </Tile>
        <Tile
          className="md:col-span-3 md:flex-row md:items-center"
          title="Equipo y salas"
          description="Tipos de sala, capacidad y horario propio de cada sala, para que nadie acabe citado en una sala ocupada o que no sirve para ese tratamiento."
        >
          <Team />
        </Tile>
      </div>
    </section>
  );
}
