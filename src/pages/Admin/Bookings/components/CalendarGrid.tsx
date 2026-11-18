import { Popover } from "radix-ui";
import { cn } from "@/lib/utils";
import {
  HOUR_HEIGHT,
  blockPosition,
  formatDayName,
  isSameDay,
  bookingTitle,
  layoutOverlaps,
  toMinutes,
  type DayOpening,
} from "../calendarUtils";
import type { Appointment } from "@/adapters/api";
import BookingBlock from "./BookingBlock";

// Week view: at most this many appointments side by side. With more at the
// same time (a big team), the last lane becomes a "+N" button with the rest:
// narrower blocks than this can't be read
const MAX_WEEK_LANES = 3;

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
          // Groups too wide for the week view: their extra appointments go in a "+N"
          const crowded = new Set(
            isWeek ? placed.filter((p) => p.columns > MAX_WEEK_LANES).map((p) => p.group) : [],
          );
          const visible = placed.filter((p) => !crowded.has(p.group) || p.column < MAX_WEEK_LANES - 1);
          const overflow = [...crowded].map((group) => ({
            group,
            items: placed.filter((p) => p.group === group && p.column >= MAX_WEEK_LANES - 1).map((p) => p.item),
          }));

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
              {visible.map(({ item, column, columns, group }) => {
                const { top, height } = blockPosition(item.startTime, item.durationMinutes, startHour);
                const lanes = crowded.has(group) ? MAX_WEEK_LANES : columns;
                return (
                  <div
                    key={item.id}
                    className="absolute z-20 p-0.5"
                    style={{
                      top,
                      height,
                      left: `${(column / lanes) * 100}%`,
                      width: `${100 / lanes}%`,
                    }}
                  >
                    <BookingBlock appointment={item} height={height} onSelect={onSelect} />
                  </div>
                );
              })}

              {/* "+N": the appointments that don't fit side by side */}
              {overflow.map(({ group, items }) => {
                const first = Math.min(...items.map((i) => toMinutes(i.startTime)));
                const last = Math.max(...items.map((i) => toMinutes(i.startTime) + i.durationMinutes));
                return (
                  <div
                    key={group}
                    className="absolute z-20 p-0.5"
                    style={{
                      top: toPx(first),
                      height: Math.max(toPx(last) - toPx(first), 28),
                      left: `${((MAX_WEEK_LANES - 1) / MAX_WEEK_LANES) * 100}%`,
                      width: `${100 / MAX_WEEK_LANES}%`,
                    }}
                  >
                    <OverflowButton items={items} onSelect={onSelect} />
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

// The appointments that didn't fit, behind a "+N". Click: the list, and each
// one opens its details. In the day view there's always room, so it never shows
function OverflowButton({ items, onSelect }: { items: Appointment[]; onSelect: (a: Appointment) => void }) {
  const sorted = [...items].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`${items.length} citas más a esta hora`}
          className="flex h-full w-full cursor-pointer flex-col items-center justify-start gap-1 rounded-lg border border-dashed border-primary/40 bg-secondary/70 px-1 py-1.5 text-xs font-medium text-primary transition-colors outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          +{items.length}
          <span className="flex flex-wrap justify-center gap-0.5">
            {sorted.slice(0, 6).map((a) => (
              <span key={a.id} className="size-1.5 rounded-full" style={{ backgroundColor: a.service.color }} />
            ))}
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="right"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 flex w-72 flex-col gap-1 rounded-xl border bg-popover p-2 text-sm text-popover-foreground shadow-lg"
        >
          <span className="px-2 py-1 text-xs text-muted-foreground">
            {items.length} citas más a esta hora
          </span>
          {sorted.map((a) => (
            <Popover.Close asChild key={a.id}>
              <button
                type="button"
                onClick={() => onSelect(a)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted"
              >
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: a.service.color }} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cn("truncate font-medium", a.status === "cancelled" && "line-through")}>
                    {bookingTitle(a)}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {a.startTime}–{a.endTime} · {a.physio.name} · {a.room.name}
                  </span>
                </span>
              </button>
            </Popover.Close>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
