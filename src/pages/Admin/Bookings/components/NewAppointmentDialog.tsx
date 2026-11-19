import { useState } from "react";
import { CircleCheck, CircleX, Loader2, Repeat } from "lucide-react";
import { toast } from "sonner";
import {
  previewClass,
  previewSeries,
  type CalendarConfig,
  type ClassInput,
  type SeriesDay,
  type SeriesInput,
} from "@/adapters/api";
import { useCreateAppointment, useCreateClass, useCreateSeries } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import AppointmentForm, { type AppointmentFormValues } from "./AppointmentForm";

type Props = {
  config: CalendarConfig;
  date: string; // suggested day ("2026-11-16")
  startTime: string; // suggested time ("09:00")
  // Physios book only for themselves: their user id. Leave out for everyone else
  lockedPhysioId?: string;
  onClose: () => void;
};

const WEEKDAYS = [
  [1, "L"],
  [2, "M"],
  [3, "X"],
  [4, "J"],
  [5, "V"],
  [6, "S"],
  [7, "D"],
] as const;

// ISO weekday of "YYYY-MM-DD": 1 = Monday … 7 = Sunday
const weekdayOf = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`).getDay();
  return d === 0 ? 7 : d;
};
const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const dayFormat = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short" });
const formatDay = (iso: string) => dayFormat.format(new Date(`${iso}T12:00:00`));

// "Nueva reserva": creates an appointment, or a weekly series of them. If a
// rule fails (closed, room full, physio busy…) the backend's message is shown
// and the form stays open. A series first shows which days can be booked
export default function NewAppointmentDialog({ config, date, startTime, lockedPhysioId, onClose }: Props) {
  const create = useCreateAppointment();
  const createSeries = useCreateSeries();
  const createClass = useCreateClass();
  const [repeat, setRepeat] = useState(false);
  // Weekdays chosen; empty = the weekday of the appointment's date
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [endsOn, setEndsOn] = useState(addDays(date, 7 * 8 - 1));
  // Second step of a series: the days and whether each can be booked
  // A group service repeated every week is created as a class (Clases): the
  // patients added become its members, and it can start with nobody
  const [preview, setPreview] = useState<
    { kind: "series"; input: SeriesInput; days: SeriesDay[] } | { kind: "class"; input: ClassInput; days: SeriesDay[] } | null
  >(null);
  const [checking, setChecking] = useState(false);

  // Sensible defaults: first service, its first fitting room, first professional
  const service = config.services[0];
  const room = config.rooms.find((r) => !service?.roomTypeId || r.roomTypeId === service.roomTypeId);
  const initial: AppointmentFormValues = {
    serviceId: service?.id ?? "",
    date,
    startTime,
    physioId: lockedPhysioId ?? config.professionals[0]?.userId ?? "",
    roomId: room?.id ?? "",
    patients: [],
    status: "booked",
    notes: "",
  };

  const single = (values: AppointmentFormValues) =>
    create.mutate(
      {
        serviceId: values.serviceId,
        roomId: values.roomId,
        physioId: values.physioId,
        date: values.date,
        startTime: values.startTime,
        patients: values.patients,
        status: values.status === "confirmed" ? "confirmed" : "booked",
        notes: values.notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Cita creada");
          onClose();
        },
        onError: (error) => toast.error("No se pudo crear la cita", { description: error.message }),
      },
    );

  const isGroup = (serviceId: string) => !!config.services.find((s) => s.id === serviceId)?.isGroup;

  const checkSeries = async (values: AppointmentFormValues) => {
    if (isGroup(values.serviceId)) {
      const input: ClassInput = {
        serviceId: values.serviceId,
        roomId: values.roomId,
        physioId: values.physioId || null,
        startTime: values.startTime,
        weekdays: weekdays.length ? weekdays : [weekdayOf(values.date)],
        startsOn: values.date,
        endsOn: endsOn < values.date ? values.date : endsOn,
        members: values.patients,
      };
      setChecking(true);
      try {
        setPreview({ kind: "class", input, days: await previewClass(input) });
      } catch (error) {
        toast.error("No se pudieron comprobar las fechas", { description: (error as Error).message });
      } finally {
        setChecking(false);
      }
      return;
    }
    const input: SeriesInput = {
      serviceId: values.serviceId,
      roomId: values.roomId,
      physioId: values.physioId,
      startTime: values.startTime,
      patients: values.patients,
      weekdays: weekdays.length ? weekdays : [weekdayOf(values.date)],
      startsOn: values.date,
      endsOn: endsOn < values.date ? values.date : endsOn,
      status: values.status === "confirmed" ? "confirmed" : "booked",
      notes: values.notes || null,
    };
    setChecking(true);
    try {
      setPreview({ kind: "series", input, days: await previewSeries(input) });
    } catch (error) {
      toast.error("No se pudieron comprobar las fechas", { description: (error as Error).message });
    } finally {
      setChecking(false);
    }
  };

  const confirmSeries = () => {
    if (!preview) return;
    if (preview.kind === "class") {
      createClass.mutate(preview.input, {
        onSuccess: ({ created, skipped }) => {
          toast.success(`Clase creada: ${created.length} sesiones`, {
            description: [
              "La encontrarás en Agenda → Clases, donde se inscriben los alumnos.",
              skipped.length ? `No se crearon ${skipped.length}: ${skipped.map((s) => `${formatDay(s.date)} (${s.message})`).join(", ")}` : "",
            ].filter(Boolean).join(" "),
          });
          onClose();
        },
        onError: (error) => toast.error("No se pudo crear la clase", { description: error.message }),
      });
      return;
    }
    createSeries.mutate(preview.input, {
      onSuccess: ({ created, skipped }) => {
        toast.success(`${created.length} ${created.length === 1 ? "cita creada" : "citas creadas"}`, {
          description: skipped.length
            ? `No se crearon ${skipped.length}: ${skipped.map((s) => `${formatDay(s.date)} (${s.message})`).join(", ")}`
            : undefined,
        });
        onClose();
      },
      onError: (error) => toast.error("No se pudo crear la serie", { description: error.message }),
    });
  };

  const pending = create.isPending || createSeries.isPending || createClass.isPending || checking;
  const okDays = preview?.days.filter((d) => d.ok).length ?? 0;

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{preview ? "Revisa las fechas" : "Nueva reserva"}</DialogTitle>
          <DialogDescription>
            {preview
              ? preview.kind === "class"
                ? `Se creará una clase con ${okDays} de ${preview.days.length} sesiones${preview.input.members?.length ? `, con ${preview.input.members.length} ${preview.input.members.length === 1 ? "alumno inscrito" : "alumnos inscritos"}` : ", sin alumnos todavía"}.`
                : `Se crearán ${okDays} de ${preview.days.length} citas. Las que no encajan se saltan.`
              : "Crea una cita en el calendario de tu clínica."}
          </DialogDescription>
        </DialogHeader>

        {preview ? (
          <>
            <ul className="flex max-h-80 flex-col divide-y overflow-y-auto rounded-xl border text-sm">
              {preview.days.map((d) => (
                <li key={d.date} className={cn("flex items-center gap-3 px-3 py-2", !d.ok && "bg-muted/40")}>
                  {d.ok ? (
                    <CircleCheck className="size-4 shrink-0 text-primary" />
                  ) : (
                    <CircleX className="size-4 shrink-0 text-destructive" />
                  )}
                  <span className="w-28 shrink-0 first-letter:uppercase">{formatDay(d.date)}</span>
                  <span className="text-muted-foreground">{d.ok ? preview.input.startTime : d.message}</span>
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-full" disabled={pending} onClick={() => setPreview(null)}>
                Volver
              </Button>
              <Button type="button" className="rounded-full" disabled={okDays === 0 || pending} onClick={confirmSeries}>
                {(createSeries.isPending || createClass.isPending) && <Loader2 className="animate-spin" />}
                {preview.kind === "class" ? "Crear clase" : `Crear ${okDays} ${okDays === 1 ? "cita" : "citas"}`}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <AppointmentForm
            config={config}
            initial={initial}
            statuses={["booked", "confirmed"]}
            submitLabel={repeat ? "Ver fechas" : "Crear cita"}
            pending={pending}
            lockedPhysioId={lockedPhysioId}
            onSubmit={(values) => (repeat ? void checkSeries(values) : single(values))}
            onCancel={onClose}
            extra={(values) => (
              <RepeatFields
                group={isGroup(values.serviceId)}
                repeat={repeat}
                onRepeat={setRepeat}
                weekdays={weekdays.length ? weekdays : [weekdayOf(values.date)]}
                onWeekdays={setWeekdays}
                startsOn={values.date}
                endsOn={endsOn}
                onEndsOn={setEndsOn}
              />
            )}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RepeatFields({
  group,
  repeat,
  onRepeat,
  weekdays,
  onWeekdays,
  startsOn,
  endsOn,
  onEndsOn,
}: {
  group: boolean;
  repeat: boolean;
  onRepeat: (on: boolean) => void;
  weekdays: number[];
  onWeekdays: (days: number[]) => void;
  startsOn: string;
  endsOn: string;
  onEndsOn: (date: string) => void;
}) {
  const toggle = (day: number) => {
    const next = weekdays.includes(day) ? weekdays.filter((d) => d !== day) : [...weekdays, day];
    // At least one day stays chosen
    onWeekdays(next.length ? next.sort() : weekdays);
  };
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      <label className="flex items-center gap-3 text-sm font-medium">
        <Checkbox checked={repeat} onCheckedChange={(v) => onRepeat(v === true)} />
        <Repeat className="size-4 text-primary" /> Repetir cada semana
      </label>
      {repeat && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label>Días</Label>
            <div className="flex gap-1.5">
              {WEEKDAYS.map(([day, label]) => (
                <button
                  key={day}
                  type="button"
                  aria-pressed={weekdays.includes(day)}
                  onClick={() => toggle(day)}
                  className={cn(
                    "size-9 rounded-full border text-sm transition-colors",
                    weekdays.includes(day) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 sm:w-48">
            <Label htmlFor="repeat-until">Hasta</Label>
            <Input
              id="repeat-until"
              type="date"
              min={startsOn}
              max={addDays(startsOn, 183)}
              value={endsOn < startsOn ? startsOn : endsOn}
              onChange={(e) => onEndsOn(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {group
              ? "Al ser un servicio en grupo se crea como una clase (Agenda → Clases). Los participantes que añadas quedan inscritos; también puedes crearla sin nadie y apuntarlos después."
              : "Como mucho 6 meses. Antes de crearlas verás qué días encajan (festivos, sala o fisio ocupados…)."}
          </p>
        </>
      )}
    </div>
  );
}
