import { useEffect, useState } from "react";
import { ArrowRight, CircleAlert, CircleX, Hand, Loader2, Mail, Plus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  previewClassEdit,
  type CalendarConfig,
  type ClassEditChanges,
  type ClassEditPreview,
  type ClassEditSession,
  type GroupClass,
} from "@/adapters/api";
import { useApplyClassEdit } from "@/adapters/hook";
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { addDays, dayLabel, today, WEEKDAY_SHORT } from "../classUtils";

// Editing or deleting a class (backend: classEdit.controller.ts). Only
// sessions from tomorrow on change; today's and past ones stay. Both dialogs
// show the plan before anything happens, and can tell the students by email

type Form = { serviceId: string; roomId: string; physioId: string | null; startTime: string; weekdays: number[]; endsOn: string };

const formOf = (cls: GroupClass): Form => ({
  serviceId: cls.service.id,
  roomId: cls.room.id,
  physioId: cls.physio?.userId ?? null,
  startTime: cls.startTime,
  weekdays: cls.weekdays,
  endsOn: cls.endsOn,
});

// Only what changed goes to the server
function changesOf(cls: GroupClass, form: Form): ClassEditChanges {
  const was = formOf(cls);
  const c: ClassEditChanges = {};
  if (form.serviceId !== was.serviceId) c.serviceId = form.serviceId;
  if (form.roomId !== was.roomId) c.roomId = form.roomId;
  if (form.physioId !== was.physioId) c.physioId = form.physioId;
  if (form.startTime !== was.startTime) c.startTime = form.startTime;
  if (form.weekdays.join() !== was.weekdays.join()) c.weekdays = form.weekdays;
  if (form.endsOn !== was.endsOn) c.endsOn = form.endsOn;
  return c;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function EditClassDialog({ cls, config, onClose }: { cls: GroupClass; config: CalendarConfig; onClose: () => void }) {
  const [form, setForm] = useState<Form>(formOf(cls));
  const [preview, setPreview] = useState<ClassEditPreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [notify, setNotify] = useState(true);
  const [message, setMessage] = useState("");
  const apply = useApplyClassEdit();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const changes = changesOf(cls, form);
  const nothing = Object.keys(changes).length === 0;
  const groupServices = config.services.filter((s) => s.isGroup);
  const minEnd = cls.startsOn > today() ? cls.startsOn : today();
  const todo = preview ? preview.summary.update + preview.summary.cancel + preview.summary.create : 0;

  const check = async () => {
    setChecking(true);
    try {
      setPreview(await previewClassEdit({ classId: cls.id, changes }));
    } catch (e) {
      toast.error("No se pudieron comprobar los cambios", { description: (e as Error).message });
    } finally {
      setChecking(false);
    }
  };

  const save = () =>
    apply.mutate(
      { classId: cls.id, changes, notify: notify && (preview?.people.withEmail ?? 0) > 0, message: message.trim() || undefined },
      {
        onSuccess: (r) => {
          toast.success("Clase actualizada", { description: resultText(r) });
          onClose();
        },
        onError: (e) => toast.error("No se pudo cambiar la clase", { description: e.message }),
      },
    );

  return (
    <Dialog open onOpenChange={(open) => !open && !apply.isPending && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{preview ? "Revisa los cambios" : "Editar clase"}</DialogTitle>
          <DialogDescription>
            {preview
              ? todo === 0
                ? "Con estos datos no cambia ninguna sesión."
                : planText(preview)
              : `Los cambios se aplican desde mañana. Las sesiones de hoy y anteriores no se tocan.`}
          </DialogDescription>
        </DialogHeader>

        {preview ? (
          <div className="flex flex-col gap-4">
            <PlanList sessions={preview.sessions} />
            <ChargedWarning count={preview.summary.charged} />
            {todo > 0 && (
              <NotifyBox preview={preview} notify={notify} setNotify={setNotify} message={message} setMessage={setMessage} disabled={apply.isPending} />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-service">Servicio</Label>
                <NativeSelect id="edit-service" value={form.serviceId} onChange={(e) => set("serviceId", e.target.value)} className="w-full">
                  {groupServices.map((s) => (
                    <NativeSelectOption key={s.id} value={s.id}>
                      {s.name} (hasta {s.maxPatients})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-room">Sala</Label>
                <NativeSelect id="edit-room" value={form.roomId} onChange={(e) => set("roomId", e.target.value)} className="w-full">
                  {config.rooms.map((r) => (
                    <NativeSelectOption key={r.id} value={r.id}>
                      {r.name} ({r.capacity} plazas)
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-physio">Fisio</Label>
              <NativeSelect id="edit-physio" value={form.physioId ?? ""} onChange={(e) => set("physioId", e.target.value || null)} className="w-full">
                <NativeSelectOption value="">Sin asignar</NativeSelectOption>
                {config.professionals.map((p) => (
                  <NativeSelectOption key={p.userId} value={p.userId}>
                    {p.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Días</Label>
              <div className="flex gap-1.5">
                {WEEKDAY_SHORT.map((label, i) => {
                  const day = i + 1;
                  const on = form.weekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        const next = on ? form.weekdays.filter((d) => d !== day) : [...form.weekdays, day].sort();
                        if (next.length) set("weekdays", next);
                      }}
                      className={cn("size-9 rounded-full border text-sm transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-time">Hora</Label>
                <Input id="edit-time" type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-until">Hasta</Label>
                <Input id="edit-until" type="date" min={minEnd} max={addDays(today(), 184)} value={form.endsOn} onChange={(e) => set("endsOn", e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Al cambiar los días, las sesiones de los días quitados se cancelan y se crean las de los días nuevos con los alumnos
              inscritos. Las sesiones que cambiaste a mano no se tocan.
            </p>
          </div>
        )}

        <DialogFooter>
          {preview ? (
            <>
              <Button variant="outline" className="rounded-full" onClick={() => setPreview(null)} disabled={apply.isPending}>
                Volver
              </Button>
              <Button className="rounded-full" disabled={todo === 0 || apply.isPending} onClick={save}>
                {apply.isPending && <Loader2 className="animate-spin" />}
                Guardar cambios
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="rounded-full" onClick={onClose}>
                Cancelar
              </Button>
              <Button className="rounded-full" disabled={nothing || checking || form.endsOn < minEnd} onClick={check}>
                {checking && <Loader2 className="animate-spin" />}
                Ver cambios
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteClassDialog({ cls, onClose }: { cls: GroupClass; onClose: () => void }) {
  const [preview, setPreview] = useState<ClassEditPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notify, setNotify] = useState(true);
  const [message, setMessage] = useState("");
  const apply = useApplyClassEdit();

  useEffect(() => {
    previewClassEdit({ classId: cls.id, delete: true })
      .then(setPreview)
      .catch((e: Error) => setError(e.message));
  }, [cls.id]);

  const sessions = preview?.sessions ?? [];
  const first = sessions[0]?.date;
  const last = sessions[sessions.length - 1]?.date;

  return (
    <Dialog open onOpenChange={(open) => !open && !apply.isPending && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar clase</DialogTitle>
          <DialogDescription>
            {cls.service.name} · {cls.startTime}. Se cancelan las sesiones desde mañana; las de hoy y anteriores se mantienen en el
            historial.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : !preview ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="rounded-xl border px-4 py-3 text-sm">
              {sessions.length === 0
                ? "No le quedan sesiones a partir de mañana."
                : `Se cancelan ${plural(sessions.length, "sesión", "sesiones")}${first ? `: del ${dayLabel(first)} al ${dayLabel(last!)}` : ""}.`}
            </p>
            <ChargedWarning count={preview.summary.charged} />
            {sessions.length > 0 && (
              <NotifyBox preview={preview} notify={notify} setNotify={setNotify} message={message} setMessage={setMessage} disabled={apply.isPending} />
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose} disabled={apply.isPending}>
            Volver
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            disabled={!preview || apply.isPending}
            onClick={() =>
              apply.mutate(
                { classId: cls.id, delete: true, notify: notify && (preview?.people.withEmail ?? 0) > 0, message: message.trim() || undefined },
                {
                  onSuccess: (r) => {
                    toast.success("Clase eliminada", { description: resultText(r) });
                    onClose();
                  },
                  onError: (e) => toast.error("No se pudo eliminar la clase", { description: e.message }),
                },
              )
            }
          >
            {apply.isPending && <Loader2 className="animate-spin" />}
            Eliminar clase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Shared pieces ----------

function planText(p: ClassEditPreview) {
  const s = p.summary;
  const parts = [
    s.update && plural(s.update, "sesión cambia", "sesiones cambian"),
    s.cancel && plural(s.cancel, "se cancela", "se cancelan"),
    s.create && plural(s.create, "sesión nueva", "sesiones nuevas"),
  ].filter(Boolean);
  return `Desde el ${dayLabel(p.cutoff)}: ${parts.join(", ")}.${s.skipped ? ` ${plural(s.skipped, "día no se puede cambiar", "días no se pueden cambiar")} (se queda como estaba).` : ""}`;
}

function resultText(r: { updated: string[]; created: string[]; cancelled: string[]; skipped: unknown[]; emailed: number }) {
  return [
    r.updated.length && plural(r.updated.length, "cambiada", "cambiadas"),
    r.cancelled.length && plural(r.cancelled.length, "cancelada", "canceladas"),
    r.created.length && plural(r.created.length, "nueva", "nuevas"),
    r.skipped.length && plural(r.skipped.length, "sin cambiar", "sin cambiar"),
    r.emailed && `${plural(r.emailed, "aviso enviado", "avisos enviados")} por email`,
  ]
    .filter(Boolean)
    .join(" · ");
}

// What happens to each session (unchanged ones are left out, except those
// changed by hand, which say so)
function PlanList({ sessions }: { sessions: ClassEditSession[] }) {
  const shown = sessions.filter((s) => s.action !== "keep" || s.detached);
  if (!shown.length) return null;
  return (
    <ul className="flex max-h-72 flex-col divide-y overflow-y-auto rounded-xl border text-sm">
      {shown.map((s) => (
        <li key={`${s.date}-${s.appointmentId ?? "new"}`} className={cn("flex items-center gap-3 px-3 py-2", (!s.ok || s.action === "cancel") && "bg-muted/40")}>
          <span className="w-24 shrink-0 first-letter:uppercase">{dayLabel(s.date)}</span>
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            {!s.ok ? (
              <>
                <TriangleAlert className="size-3.5 shrink-0 text-amber-600" />
                <span className="text-muted-foreground">No se puede: {s.message}</span>
              </>
            ) : s.action === "cancel" ? (
              <>
                <CircleX className="size-3.5 shrink-0 text-destructive" />
                <span>Se cancela{s.patients ? ` · ${plural(s.patients, "alumno", "alumnos")}` : ""}</span>
              </>
            ) : s.action === "create" ? (
              <>
                <Plus className="size-3.5 shrink-0 text-primary" />
                <span>Nueva · {s.startTime}</span>
              </>
            ) : s.action === "update" ? (
              <>
                <ArrowRight className="size-3.5 shrink-0 text-primary" />
                <span>{s.fromTime !== s.startTime ? `${s.fromTime} → ${s.startTime}` : "Cambia sala, fisio o servicio"}</span>
              </>
            ) : (
              <>
                <Hand className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{s.message}</span>
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ChargedWarning({ count }: { count: number }) {
  if (!count) return null;
  return (
    <p className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      {plural(count, "sesión de las que se cancelan ya estaba cobrada o con bono", "sesiones de las que se cancelan ya estaban cobradas o con bono")}. Las
      cobradas quedan «a revisar» en Cobros; las de bono vuelven al bono.
    </p>
  );
}

function NotifyBox({
  preview,
  notify,
  setNotify,
  message,
  setMessage,
  disabled,
}: {
  preview: ClassEditPreview;
  notify: boolean;
  setNotify: (v: boolean) => void;
  message: string;
  setMessage: (v: string) => void;
  disabled: boolean;
}) {
  const { withEmail, withoutEmail } = preview.people;
  if (withEmail + withoutEmail === 0) return null;
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      {withEmail > 0 ? (
        <label className="flex items-start gap-2.5 text-sm">
          <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} disabled={disabled} className="mt-0.5" />
          <span>
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="size-3.5" /> Avisar por email a {plural(withEmail, "alumno", "alumnos")}
            </span>
            <span className="text-muted-foreground">
              Cada uno recibe un email con sus sesiones canceladas, las que cambian de hora y las nuevas.
              {withoutEmail > 0 && ` ${plural(withoutEmail, "alumno no tiene", "alumnos no tienen")} email: avísales tú.`}
            </span>
          </span>
        </label>
      ) : (
        <p className="text-sm text-muted-foreground">
          {plural(withoutEmail, "alumno afectado no tiene", "alumnos afectados no tienen")} email: avísales tú.
        </p>
      )}
      {withEmail > 0 && notify && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="class-message">Mensaje para los alumnos (opcional)</Label>
          <Textarea
            id="class-message"
            rows={2}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Por ejemplo: cambiamos de día por obras en la sala."
            disabled={disabled}
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground">Las sesiones canceladas se quedan en el historial de cada alumno.</p>
    </div>
  );
}
