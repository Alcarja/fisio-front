import { cn } from "@/lib/utils";
import {
  HOUR_HEIGHT,
  blockPosition,
  formatDayName,
  isSameDay,
  layoutOverlaps,
  toMinutes,
  type DayOpening,
} from "../calendarUtils";
import type { Appointment } from "@/adapters/api";
import BookingBlock from "./BookingBlock";

// Diagonal stripes for the hours the clinic is closed
const closedPattern = {
  backgroundImage:
    "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklch, var(--muted-foreground) 9%, transparent) 6px 7px)",
};

type Props = {
  days: Date[]; // columns, left to right
  startHour: number; // first and last hour of the grid
  endHour: number;
  // When the clinic opens each day. null = no schedule configured (nothing shaded)
  openingFor: (day: Date) => DayOpening | null;
  bookingsFor: (day: Date) => Appointment[];
  // Click on an appointment
  onSelect: (appointment: Appointment) => void;
  now: Date;
};

// Parts of the day (in minutes) outside the opening ranges, to shade them
function closedSegments(opening: DayOpening, startHour: number, endHour: number) {
  const dayStart = startHour * 60;
  const dayEnd = endHour * 60;
  const open = opening.ranges
    .map((r) => [toMinutes(r.startTime), toMinutes(r.endTime)] as const)
    .sort((a, b) => a[0] - b[0]);

  const segments: [number, number][] = [];
  let cursor = dayStart;
  for (const [start, end] of open) {
    if (start > cursor) segments.push([cursor, Math.min(start, dayEnd)]);
    cursor = Math.max(cursor, end);
  }
  if (cursor < dayEnd) segments.push([cursor, dayEnd]);
  return segments;
}

// The calendar itself: hours down the left, one column per day, the clinic's
// closed hours shaded, and the appointments placed by start time and length.
// Scrolls inside its own box
export default function CalendarGrid({
  days,
  startHour,
  endHour,
  openingFor,
  bookingsFor,
  onSelect,
  now,
}: Props) {
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const gridHeight = hours.length * HOUR_HEIGHT;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowVisible = nowMinutes >= startHour * 60 && nowMinutes < endHour * 60;
  const nowTop = ((nowMinutes - startHour * 60) / 60) * HOUR_HEIGHT;
  const isWeek = days.length > 1;
  const toPx = (minutes: number) => ((minutes - startHour * 60) / 60) * HOUR_HEIGHT;

  return (
    <div className="max-h-[70svh] overflow-auto rounded-[1.5rem] border bg-card">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `4rem repeat(${days.length}, minmax(${isWeek ? "8.5rem" : "0"}, 1fr))`,
        }}
      >
        {/* Header: day names (stays visible when scrolling) */}
        <div className="sticky top-0 z-30 border-b bg-card" />
        {days.map((day) => {
          const isToday = isSameDay(day, now);
          const opening = openingFor(day);
          const closed = opening !== null && opening.ranges.length === 0;
          const special = opening?.exception?.type === "special_hours";
          return (
            <div
              key={day.toISOString()}
              className="sticky top-0 z-30 flex flex-col items-center gap-0.5 border-b border-l bg-card py-2"
            >
              <span
                className={cn(
                  "text-xs uppercase",
                  isToday ? "font-medium text-primary" : "text-muted-foreground",
                )}
              >
                {formatDayName(day)}
              </span>
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm tabular-nums",
                  isToday && "bg-primary font-medium text-primary-foreground",
                  !isToday && closed && "text-muted-foreground",
                )}
              >
                {day.getDate()}
              </span>
              {(closed || special) && (
                <span className="text-[10px] text-muted-foreground">
                  {closed ? "Cerrado" : "Horario especial"}
                </span>
              )}
            </div>
          );
        })}

        {/* Hour labels */}
        <div className="relative" style={{ height: gridHeight }}>
          {hours.map((hour, i) => (
            <span
              key={hour}
              className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground tabular-nums"
              style={{ top: i * HOUR_HEIGHT }}
            >
              {i === 0 ? "" : `${String(hour).padStart(2, "0")}:00`}
            </span>
          ))}
        </div>

        {/* One column per day */}
        {days.map((day) => {
          const isToday = isSameDay(day, now);
          const opening = openingFor(day);
          const closedAllDay = opening !== null && opening.ranges.length === 0;
          const placed = layoutOverlaps(bookingsFor(day));

          return (
            <div
              key={day.toISOString()}
              className={cn("relative border-l", isToday && "bg-primary/[0.03]")}
              style={{ height: gridHeight }}
            >
              {/* Hour lines (solid) and half-hour lines (dashed) */}
              {hours.map((hour, i) => (
                <div key={hour} className="absolute inset-x-0" style={{ top: i * HOUR_HEIGHT }}>
                  {i > 0 && <div className="border-t" />}
                  <div
                    className="border-t border-dashed border-border/60"
                    style={{ marginTop: HOUR_HEIGHT / 2 - (i > 0 ? 1 : 0) }}
                  />
                </div>
              ))}

              {/* Closed hours: striped */}
              {opening &&
                closedSegments(opening, startHour, endHour).map(([from, to]) => (
                  <div
                    key={from}
                    className="absolute inset-x-0 bg-muted/40"
                    style={{ ...closedPattern, top: toPx(from), height: toPx(to) - toPx(from) }}
                    aria-hidden
                  />
                ))}

              {/* Whole day closed: say why */}
              {closedAllDay && (
                <div className="absolute inset-x-2 top-6 z-10 rounded-lg border bg-card/90 px-2 py-1.5 text-center text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Cerrado</span>
                  {opening.exception?.reason && <span> · {opening.exception.reason}</span>}
                </div>
              )}

              {/* Appointments: side by side when they overlap */}
              {placed.map(({ item, column, columns }) => {
                const { top, height } = blockPosition(item.startTime, item.durationMinutes, startHour);
                return (
                  <div
                    key={item.id}
                    className="absolute z-20 p-0.5"
                    style={{
                      top,
                      height,
                      left: `${(column / columns) * 100}%`,
                      width: `${100 / columns}%`,
                    }}
                  >
                    <BookingBlock appointment={item} height={height} onSelect={onSelect} />
                  </div>
                );
              })}

              {/* Current time */}
              {isToday && nowVisible && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                  style={{ top: nowTop }}
                  aria-hidden
                >
                  <span className="-ml-1 size-2 rounded-full bg-coral" />
                  <span className="h-px flex-1 bg-coral" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
