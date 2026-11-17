import { BellOff, Check, DoorOpen, TriangleAlert, Users } from "lucide-react";
import type { Appointment } from "@/adapters/api";
import { cn } from "@/lib/utils";
import { bookingTitle, missesReminder, patientName, statusLabels } from "../calendarUtils";

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
    <button
      type="button"
      onClick={() => onSelect(appointment)}
      // Native tooltip with everything, for short blocks
      title={[
        title,
        service.isGroup ? appointment.patients.map(patientName).join(", ") : service.name,
        range,
        appointment.physio.name,
        appointment.room.name,
        statusLabels[status],
        ...appointment.issues.map((i) => `⚠ ${i.message}`),
        noReminder ? "🔕 Sin recordatorio: falta el email del paciente" : "",
      ]
        .filter(Boolean)
        .join("\n")}
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
      {(hasIssues || noReminder) && (
        <span className="absolute top-1 right-1 flex items-center gap-0.5">
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
            {service.isGroup ? appointment.physio.name : service.name}
          </span>
          {roomy && (
            <span className="mt-auto flex flex-col gap-0.5 pt-1 text-[11px] text-muted-foreground">
              {!service.isGroup && <span className="truncate">{appointment.physio.name}</span>}
              <span className="flex items-center gap-1 truncate">
                {service.isGroup ? <Users className="size-3" /> : <DoorOpen className="size-3" />}
                {appointment.room.name}
              </span>
            </span>
          )}
        </>
      )}
    </button>
  );
}
