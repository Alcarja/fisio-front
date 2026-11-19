import { useState } from "react";
import { CircleAlert, Loader2 } from "lucide-react";
import { useAppointments, useCalendarConfig, useMe } from "@/adapters/hook";
import MemberAvatar from "@/components/MemberAvatar";
import { cn } from "@/lib/utils";
import BreakdownCard from "./components/BreakdownCard";
import ChargesArchiveCard from "./components/ChargesArchiveCard";
import MonthPicker from "./components/MonthPicker";
import PhysioServiceTable from "./components/PhysioServiceTable";
import StatTiles from "./components/StatTiles";
import {
  addMonths,
  buildMonthReport,
  isSameMonth,
  monthRange,
  startOfMonth,
} from "./reportUtils";

// Informes: the active clinic's appointments of one month, broken down by
// service and by physio. Owners and admins (teamAccess in router.tsx).
// Data: the same calendar endpoints as Reservas, for the whole month. The
// physio × service table loads its own: GET /clinic/reports/monthly
export default function ReportsPage() {
  const { data: me } = useMe();
  const clinicId = me?.activeClinic?.clinicId;
  const [now] = useState(() => new Date());
  const [month, setMonth] = useState(() => startOfMonth(now));

  const range = monthRange(month);
  const config = useCalendarConfig(clinicId, range);
  const appointments = useAppointments(clinicId, range);

  const header = (
    <header className="flex flex-col gap-2">
      <span className="text-sm font-medium text-coral">
        {me?.activeClinic?.clinicName ?? "Clínica"}
      </span>
      <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">Informes</h1>
      <p className="text-muted-foreground">Las reservas de cada mes, por servicio y por fisio.</p>
    </header>
  );

  if (config.isPending || appointments.isPending) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="flex justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  if (!config.data || !appointments.data) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {(config.error ?? appointments.error)?.message ?? "No se pudo cargar el informe"}
        </div>
      </div>
    );
  }

  const report = buildMonthReport(appointments.data, config.data);
  const total = report.totals.appointments;
  // While another month loads, the previous one stays on screen, dimmed
  const loadingMonth = config.isPlaceholderData || appointments.isPlaceholderData;

  return (
    <div className="flex flex-col gap-6">
      {header}

      <MonthPicker
        month={month}
        isCurrent={isSameMonth(month, now)}
        onPrevious={() => setMonth((m) => addMonths(m, -1))}
        onNext={() => setMonth((m) => addMonths(m, 1))}
        onCurrent={() => setMonth(startOfMonth(now))}
      />

      <div
        className={cn("flex flex-col gap-6 transition-opacity", loadingMonth && "opacity-50")}
        aria-busy={loadingMonth}
      >
        <StatTiles totals={report.totals} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <BreakdownCard
            title="Por tipo de servicio"
            description="Cuántas citas hubo de cada servicio."
            total={total}
            items={report.byService.map((s) => ({
              id: s.id,
              name: s.name,
              totals: s.totals,
              extra:
                s.totals.patients > s.totals.appointments
                  ? `${s.totals.patients} pacientes`
                  : undefined,
              marker: (
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                  aria-hidden
                />
              ),
            }))}
          />
          <BreakdownCard
            title="Por fisio"
            description="Cuántas citas atendió cada profesional."
            total={total}
            items={report.byPhysio.map((p) => ({
              id: p.id,
              name: p.name,
              totals: p.totals,
              marker: <MemberAvatar member={p} />,
            }))}
          />
        </div>

        <PhysioServiceTable month={month} />
      </div>

      <ChargesArchiveCard />
    </div>
  );
}
