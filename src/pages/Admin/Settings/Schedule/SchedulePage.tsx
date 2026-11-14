import { CircleAlert, Loader2 } from "lucide-react";
import { useClinicSchedule, useMe } from "@/adapters/hook";
import ExceptionsSection from "./components/ExceptionsSection";
import TimezoneSection from "./components/TimezoneSection";
import WeeklyHoursSection from "./components/WeeklyHoursSection";

// Configuración → Horario (CALENDARIO.md, section 1): weekly hours, exceptions
// and time zone of the active clinic. Backend: /clinic/settings/schedule
// (back/src/routes/schedule.routes.ts), owners and admins only
export default function SchedulePage() {
  const { data: me } = useMe();
  const { data: schedule, isPending, error } = useClinicSchedule(me?.activeClinic?.clinicId);

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      >
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* key: start the form again from the saved data after each save */}
      <WeeklyHoursSection
        key={JSON.stringify(schedule.weeklyHours)}
        weeklyHours={schedule.weeklyHours}
      />
      <ExceptionsSection exceptions={schedule.exceptions} />
      <TimezoneSection key={schedule.timezone} timezone={schedule.timezone} />
    </div>
  );
}
