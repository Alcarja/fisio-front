import { BellOff } from "lucide-react";

type Props = {
  services: { name: string; color: string }[];
  // The clinic sends reminders: explain the "no reminder" mark
  reminders?: boolean;
};

// Below the calendar: what the colors and styles mean
export default function CalendarLegend({ services, reminders = false }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-medium text-foreground">Servicios</span>
        {services.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-medium text-foreground">Estado</span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm border border-l-[3px] border-dashed border-foreground/60 bg-muted" />
          Reservada (sin confirmar)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm border-l-[3px] border-l-foreground/60 bg-muted" />
          Confirmada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm border-l-[3px] border-l-foreground/60 bg-muted" />
          Realizada ✓
        </span>
        <span className="flex items-center gap-1.5 opacity-60">
          <span className="h-3 w-4 rounded-sm border-l-[3px] border-l-foreground/60 bg-muted" />
          No se presentó
        </span>
        <span className="flex items-center gap-1.5 opacity-60">
          <span className="h-3 w-4 rounded-sm border-l-[3px] border-l-foreground/60 bg-muted" />
          <span className="line-through">Cancelada</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm bg-muted ring-2 ring-amber-500/70" />
          ⚠ Revisar (ya no encaja)
        </span>
        {reminders && (
          <span className="flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded-full bg-rose-600 text-white dark:bg-rose-500">
              <BellOff className="size-2.5" />
            </span>
            Sin recordatorio (falta el email)
          </span>
        )}
      </div>
    </div>
  );
}
