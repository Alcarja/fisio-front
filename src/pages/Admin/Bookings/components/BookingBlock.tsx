import { BellOff, Check, Clock, DoorOpen, Repeat, Stethoscope, TriangleAlert, User, Users } from "lucide-react";
import { HoverCard } from "radix-ui";
import type { ReactNode } from "react";
import type { Appointment } from "@/adapters/api";
import { cn } from "@/lib/utils";
import { bookingTitle, missesReminder, patientName, statusLabels } from "../calendarUtils";
import { formatMinutes } from "../../Settings/Services/serviceFormat";

type Props = {
  appointment: Appointment;
  // Height in pixels: short appointments show less information
  height: number;
  // Click: open its details
  onSelect: (appointment: Appointment) => void;
};

// One appointment in the calendar, clickable to see its details.
// Its color is the service's color. ⚠ = it no longer fits (see its details).
// Reservada (not confirmed yet) = dashed border · Realizada = ✓ ·
// No se presentó and Cancelada = faded (cancelled also struck through) ·
// 🔕 red corner = some patient won't get a reminder (no email)
export default function BookingBlock({ appointment, height, onSelect }: Props) {
  const { service, status } = appointment;
  const short = height < 44; // ~40 min or less: one line
  const roomy = height >= 80; // ~75 min or more: physio and room too
  const range = `${appointment.startTime}–${appointment.endTime}`;
  const faded = status === "cancelled" || status === "no_show";
  const title = bookingTitle(appointment);
  const hasIssues = appointment.issues.length > 0;
  const noReminder = missesReminder(appointment);

  return (
    // Hovering shows the details (handy when several appointments share the
    // hour and each block is narrow). A click opens them in full, as before.
    // On touch screens there's no hover: the click is the way
    <HoverCard.Root openDelay={250} closeDelay={80}>
      <HoverCard.Trigger asChild>
    <button
      type="button"
      onClick={() => onSelect(appointment)}
      aria-label={`${title}, ${range}, ${appointment.physio?.name ?? "sin fisio"}`}
      className={cn(
        "relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left text-xs leading-tight shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-shadow outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50",
        status === "booked" && "border border-l-[3px] border-dashed",
        faded && "opacity-50",
        hasIssues && "ring-2 ring-amber-500/70",
      )}
      style={{
        borderLeftColor: service.color,
        borderColor: status === "booked" ? service.color : undefined,
        // Light tint of the service color
        backgroundColor: `${service.color}1F`,
      }}
    >
      {(hasIssues || noReminder || (appointment.seriesId && !appointment.detached)) && (
        <span className="absolute top-1 right-1 flex items-center gap-0.5">
          {appointment.seriesId && !appointment.detached && (
            <Repeat className="size-3 text-muted-foreground" aria-label="Se repite cada semana" />
          )}
          {noReminder && (
            <span
              className="flex size-4 items-center justify-center rounded-full bg-rose-600 text-white dark:bg-rose-500"
              aria-label="Sin recordatorio: falta el email del paciente"
            >
              <BellOff className="size-2.5" />
            </span>
          )}
          {hasIssues && (
            <TriangleAlert
              className="size-3.5 text-amber-600 dark:text-amber-400"
              aria-label="Esta cita necesita revisión"
            />
          )}
        </span>
      )}
      {short ? (
        <span className={cn("truncate font-medium", status === "cancelled" && "line-through")}>
          {appointment.startTime} · {title}
        </span>
      ) : (
        <>
          <span className="flex items-center gap-1 truncate text-[11px] text-muted-foreground tabular-nums">
            {range}
            {status === "completed" && <Check className="size-3 text-primary" />}
          </span>
          <span className={cn("truncate font-medium", status === "cancelled" && "line-through")}>
            {title}
          </span>
          <span className="truncate text-muted-foreground">
            {service.isGroup ? (appointment.physio?.name ?? "Sin fisio") : service.name}
          </span>
          {roomy && (
            <span className="mt-auto flex flex-col gap-0.5 pt-1 text-[11px] text-muted-foreground">
              {!service.isGroup && <span className="truncate">{appointment.physio?.name}</span>}
              <span className="flex items-center gap-1 truncate">
                {service.isGroup ? <Users className="size-3" /> : <DoorOpen className="size-3" />}
                {appointment.room.name}
              </span>
            </span>
          )}
        </>
      )}
    </button>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="right"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 w-72 rounded-xl border bg-popover p-3 text-sm text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <BookingSummary appointment={appointment} />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}

// What the hover card shows: everything needed to know the session at a glance
function BookingSummary({ appointment }: { appointment: Appointment }) {
  const { service, status } = appointment;
  const missing = appointment.patients.filter((p) => p.reminder === "missing");
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-start gap-2">
        <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: service.color }} />
        <div className="flex min-w-0 flex-col">
          <span className={cn("font-medium", status === "cancelled" && "line-through")}>{bookingTitle(appointment)}</span>
          <span className="text-xs text-muted-foreground">
            {service.name} · {statusLabels[status]}
          </span>
        </div>
      </div>
      <dl className="flex flex-col gap-1 text-xs">
        <Row icon={<Clock />}>
          {appointment.startTime}–{appointment.endTime} ({formatMinutes(appointment.durationMinutes)})
        </Row>
        <Row icon={<Stethoscope />}>{appointment.physio?.name ?? "Sin fisio asignado"}</Row>
        <Row icon={<DoorOpen />}>{appointment.room.name}</Row>
        <Row icon={service.isGroup ? <Users /> : <User />}>
          {service.isGroup
            ? `${appointment.patients.length}/${service.maxPatients}: ${appointment.patients.map(patientName).join(", ")}`
            : appointment.patients.map(patientName).join(", ")}
        </Row>
      </dl>
      {appointment.notes && (
        <p className="line-clamp-3 rounded-lg bg-muted px-2 py-1.5 text-xs text-muted-foreground">{appointment.notes}</p>
      )}
      {appointment.issues.length > 0 && (
        <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {appointment.issues.map((i) => i.message).join(" · ")}
        </p>
      )}
      {missing.length > 0 && (
        <p className="flex items-start gap-1.5 text-xs text-rose-700 dark:text-rose-400">
          <BellOff className="mt-0.5 size-3.5 shrink-0" />
          Sin recordatorio: falta el email de {missing.map(patientName).join(", ")}
        </p>
      )}
      <span className="text-[11px] text-muted-foreground">Haz clic para ver o editar la cita</span>
    </div>
  );
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-px text-muted-foreground [&_svg]:size-3.5">{icon}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}
