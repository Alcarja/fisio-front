import type { OpeningHours, TimeRange } from "@/adapters/api";
import { sortRanges, weekdays } from "../Schedule/scheduleUtils";

// "Lun · Mar · Jue": the days with at least one slot
export const openDaysLabel = (hours: OpeningHours[]) =>
  weekdays
    .filter((d) => hours.some((h) => h.weekday === d.value))
    .map((d) => d.short)
    .join(" · ");

// Is some slot (partly) outside the clinic's hours that day? Bookings are only
// offered inside both, so that part would never be offered.
// Clinic slots that touch (09:00–14:00 + 14:00–20:00) count as one
export function isOutsideClinicHours(ranges: TimeRange[], clinicRanges: TimeRange[]): boolean {
  const merged: TimeRange[] = [];
  for (const range of sortRanges(clinicRanges)) {
    const last = merged.at(-1);
    if (last && range.startTime <= last.endTime) {
      if (range.endTime > last.endTime) last.endTime = range.endTime;
    } else {
      merged.push({ ...range });
    }
  }
  return ranges.some(
    (r) => !merged.some((c) => c.startTime <= r.startTime && r.endTime <= c.endTime),
  );
}
