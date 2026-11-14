import type { LucideIcon } from "lucide-react";
import { CalendarCheck, Clock, UserX, Users } from "lucide-react";
import { formatHours, formatPercent, share, type Totals } from "../reportUtils";

type Tile = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
};

// The month in four numbers. Values use the sans face with proportional
// figures (they stand alone, they don't line up in columns)
export default function StatTiles({ totals }: { totals: Totals }) {
  const tiles: Tile[] = [
    {
      icon: CalendarCheck,
      label: "Citas",
      value: totals.appointments.toLocaleString("es-ES"),
      detail:
        totals.cancelled > 0
          ? `Sin contar ${totals.cancelled} cancelada${totals.cancelled === 1 ? "" : "s"}`
          : "Ninguna cancelada",
    },
    {
      icon: Clock,
      label: "Horas de sesión",
      value: formatHours(totals.minutes),
      detail:
        totals.appointments > 0
          ? `${formatHours(Math.round(totals.minutes / totals.appointments))} de media por cita`
          : "Sin citas este mes",
    },
    {
      icon: Users,
      label: "Pacientes",
      value: totals.patients.toLocaleString("es-ES"),
      detail: "Plazas ocupadas, también en grupos",
    },
    {
      icon: UserX,
      label: "Ausencias",
      value: totals.noShows.toLocaleString("es-ES"),
      detail:
        totals.appointments > 0
          ? `${formatPercent(share(totals.noShows, totals.appointments))} de las citas`
          : "—",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div key={tile.label} className="flex flex-col gap-1 rounded-[1.5rem] border bg-card p-4 sm:p-5">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="size-4 text-primary" aria-hidden />
              {tile.label}
            </dt>
            <dd className="text-3xl font-semibold tracking-tight sm:text-4xl">{tile.value}</dd>
            <dd className="text-xs text-muted-foreground">{tile.detail}</dd>
          </div>
        );
      })}
    </dl>
  );
}
