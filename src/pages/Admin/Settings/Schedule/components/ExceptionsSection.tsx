import { useState } from "react";
import { CalendarOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ScheduleException } from "@/adapters/api";
import { useDeleteScheduleException } from "@/adapters/hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SettingsSection from "../../components/SettingsSection";
import { formatDateRange, formatRanges, todayIso } from "../scheduleUtils";
import AddExceptionDialog from "./AddExceptionDialog";

type Props = {
  exceptions: ScheduleException[];
};

// Holidays, closures and periods with special hours. Past ones are hidden
export default function ExceptionsSection({ exceptions }: Props) {
  const remove = useDeleteScheduleException();
  // "Today" read once, not on every render
  const [today] = useState(todayIso);

  const upcoming = exceptions
    .filter((e) => e.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const handleDelete = (exception: ScheduleException) =>
    remove.mutate(exception.id, {
      onSuccess: () => toast.success("Excepción eliminada"),
      onError: (error) =>
        toast.error("No se pudo eliminar la excepción", { description: error.message }),
    });

  return (
    <SettingsSection
      title="Excepciones"
      description="Festivos, vacaciones u horarios especiales. Mandan sobre el horario semanal."
      action={<AddExceptionDialog />}
    >
      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          <CalendarOff className="size-5" />
          No hay excepciones próximas.
        </div>
      ) : (
        <ul className="flex flex-col divide-y">
          {upcoming.map((exception) => {
            const isDeleting = remove.isPending && remove.variables === exception.id;
            return (
              <li
                key={exception.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0"
              >
                <Badge
                  variant={exception.type === "closed" ? "outline" : "secondary"}
                  className="w-32 justify-center"
                >
                  {exception.type === "closed" ? "Cerrado" : "Horario especial"}
                </Badge>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium first-letter:uppercase">
                    {formatDateRange(exception.startDate, exception.endDate)}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {[
                      exception.reason,
                      exception.type === "special_hours" && formatRanges(exception.hours),
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Sin motivo"}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(exception)}
                  disabled={isDeleting}
                  aria-label="Eliminar excepción"
                >
                  {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </SettingsSection>
  );
}
