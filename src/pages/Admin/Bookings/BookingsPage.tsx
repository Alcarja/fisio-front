import { useState } from "react";
import { Link } from "react-router";
import { CircleAlert, Clock, Loader2 } from "lucide-react";
import { useAppointments, useCalendarConfig, useMe } from "@/adapters/hook";
import { hasAccess, manageAllAppointmentsAccess, teamAccess } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import {
  addDays,
  formatDayLong,
  formatWeekRange,
  openingFor,
  startOfWeek,
  toIsoDate,
  visibleHours,
} from "./calendarUtils";
import BookingDetailsDialog from "./components/BookingDetailsDialog";
import CalendarGrid from "./components/CalendarGrid";
import CalendarLegend from "./components/CalendarLegend";
import CalendarToolbar, { type CalendarView } from "./components/CalendarToolbar";
import NewAppointmentDialog from "./components/NewAppointmentDialog";

// Phones start on the day view (a 6-day grid is too wide)
const prefersDayView = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

// Reservas: the active clinic's appointments calendar, for every clinic role.
// Clinic settings: GET /clinic/calendar/config.
// Appointments: /clinic/calendar/appointments (list, create, edit, cancel, delete)
export default function BookingsPage() {
  const { data: me } = useMe();
  const clinicId = me?.activeClinic?.clinicId;
  // Read once, not on every render
  const [now] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>(() => (prefersDayView() ? "day" : "week"));
  // The day the calendar is on (its week, in the week view)
  const [anchor, setAnchor] = useState(now);
  const [physioId, setPhysioId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // The whole visible week (Monday to Sunday) is loaded at once
  const monday = startOfWeek(anchor);
  const range = { from: toIsoDate(monday), to: toIsoDate(addDays(monday, 6)) };
  const config = useCalendarConfig(clinicId, range);
  const appointments = useAppointments(clinicId, range);

  if (config.isPending || appointments.isPending) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!config.data || !appointments.data) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      >
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        {(config.error ?? appointments.error)?.message ?? "No se pudo cargar el calendario"}
      </div>
    );
  }

  const settings = config.data;
  const allAppointments = appointments.data;
  const hasSchedule = settings.weeklyHours.length > 0;
  const { startHour, endHour } = visibleHours(settings.weeklyHours, settings.exceptions);

  // Week view: Monday to Saturday, plus Sunday if the clinic opens on Sundays
  const weekLength = settings.weeklyHours.some((h) => h.weekday === 7) ? 7 : 6;
  const days =
    view === "week" ? Array.from({ length: weekLength }, (_, i) => addDays(monday, i)) : [anchor];
  const title = view === "week" ? formatWeekRange(monday, weekLength) : formatDayLong(anchor);

  const step = view === "week" ? 7 : 1;
  const goPrevious = () => setAnchor((d) => addDays(d, -step));
  const goNext = () => setAnchor((d) => addDays(d, step));

  // When the clinic opens each day (null = no schedule yet: nothing shaded)
  const dayOpening = (day: Date) =>
    hasSchedule ? openingFor(day, settings.weeklyHours, settings.exceptions) : null;

  const appointmentsFor = (day: Date) => {
    const iso = toIsoDate(day);
    return allAppointments.filter(
      (a) => a.date === iso && (!physioId || a.physio.userId === physioId),
    );
  };

  // "Nueva reserva": the day on screen (today in the current week), at opening time
  const suggestedDay =
    view === "day" ? anchor : (days.find((d) => toIsoDate(d) === toIsoDate(now)) ?? monday);
  const suggestedTime = dayOpening(suggestedDay)?.ranges[0]?.startTime ?? "09:00";

  const selected = allAppointments.find((a) => a.id === selectedId) ?? null;
  const canManage = hasAccess(me, teamAccess); // owners and admins (settings, delete)
  // Owners, admins and reception change any appointment; physios only their own
  const canEditAll = hasAccess(me, manageAllAppointmentsAccess);
  const myId = me?.user.id;
  const lockedPhysioId = canEditAll ? undefined : myId;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-coral">
          {me?.activeClinic?.clinicName ?? "Clínica"}
        </span>
        <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">Reservas</h1>
        <p className="text-muted-foreground">Las citas de tu clínica, día a día.</p>
      </header>

      {!hasSchedule && (
        <div className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm">
          <Clock className="mt-0.5 size-4 shrink-0 text-coral" />
          <span>
            Tu clínica todavía no tiene horario, así que no se pueden dar citas.
            {canManage ? (
              <>
                {" "}
                <Link
                  to={paths.adminSettingsSchedule}
                  className="font-medium underline underline-offset-4"
                >
                  Configura el horario
                </Link>
                .
              </>
            ) : (
              " Pide al propietario o a un administrador que lo configure."
            )}
          </span>
        </div>
      )}

      <CalendarToolbar
        title={title}
        view={view}
        onViewChange={setView}
        onPrevious={goPrevious}
        onNext={goNext}
        onToday={() => setAnchor(now)}
        onNewBooking={() => setCreating(true)}
      />

      {/* Filter by physio */}
      {settings.professionals.length > 1 && (
        <div role="radiogroup" aria-label="Filtrar por fisio" className="flex flex-wrap gap-1.5">
          {[null, ...settings.professionals].map((p) => {
            const id = p?.userId ?? null;
            const selectedChip = physioId === id;
            return (
              <button
                key={id ?? "all"}
                type="button"
                role="radio"
                aria-checked={selectedChip}
                onClick={() => setPhysioId(id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  selectedChip
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {p?.name ?? "Todos los fisios"}
              </button>
            );
          })}
        </div>
      )}

      <CalendarGrid
        days={days}
        startHour={startHour}
        endHour={endHour}
        openingFor={dayOpening}
        bookingsFor={appointmentsFor}
        onSelect={(a) => setSelectedId(a.id)}
        now={now}
      />

      {settings.services.length > 0 && <CalendarLegend services={settings.services} />}

      {creating && (
        <NewAppointmentDialog
          config={settings}
          date={toIsoDate(suggestedDay)}
          startTime={suggestedTime}
          lockedPhysioId={lockedPhysioId}
          onClose={() => setCreating(false)}
        />
      )}

      {selected && (
        <BookingDetailsDialog
          key={selected.id}
          appointment={selected}
          config={settings}
          canDelete={canManage}
          canEdit={canEditAll || selected.physio.userId === myId}
          lockedPhysioId={lockedPhysioId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
