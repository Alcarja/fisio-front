import { useState } from "react";
import {
  CalendarPlus,
  CircleAlert,
  CircleCheck,
  CircleX,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  previewClass,
  type AppointmentPatientInput,
  type CalendarConfig,
  type ClassInput,
  type ClassMember,
  type GroupClass,
  type SeriesDay,
} from "@/adapters/api";
import {
  useAddClassMember,
  useCalendarConfig,
  useClasses,
  useCreateClass,
  useExtendClass,
  useMe,
  useRemoveClassMember,
  useUpdateSeries,
} from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { hasAccess, manageAllAppointmentsAccess } from "@/lib/roles";
import { cn } from "@/lib/utils";
import PatientFields from "../Bookings/components/PatientFields";
import { addDays, dayLabel, shortDate, summary, today, weekdaysLabel, WEEKDAY_SHORT } from "./classUtils";
import { DeleteClassDialog, EditClassDialog } from "./components/EditClassDialog";

// Clases: the clinic's group classes (a weekly series of a group service with
// enrolled members). Everyone sees them; owners, admins and reception create
// classes, enrol and remove members, assign the physio and extend them.
// Each session is a normal appointment in Reservas (attendance is taken there)
export default function ClassesPage() {
  const { data: me } = useMe();
  const clinicId = me?.activeClinic?.clinicId;
  const canManage = hasAccess(me, manageAllAppointmentsAccess);
  const { data, isPending, error } = useClasses(clinicId);
  const config = useCalendarConfig(clinicId, { from: today(), to: today() }).data;
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-coral">{me?.activeClinic?.clinicName ?? "Clínica"}</span>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">Clases</h1>
          {canManage && (
            <Button className="rounded-full" onClick={() => setCreating(true)} disabled={!config}>
              <Plus /> Nueva clase
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          Clases de grupo que se repiten cada semana, con sus alumnos. Cada sesión aparece en Reservas.
        </p>
      </header>

      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error.message}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[1.75rem] border bg-card px-6 py-14 text-center">
          <Users className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Todavía no hay clases. Por ejemplo: pilates los martes y jueves a las 19:00.</p>
          {canManage && (
            <Button className="rounded-full" onClick={() => setCreating(true)} disabled={!config}>
              Crear la primera clase
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.map((c) => (
            <ClassCard key={c.id} cls={c} config={config} canManage={canManage} />
          ))}
        </div>
      )}

      {creating && config && <NewClassDialog config={config} onClose={() => setCreating(false)} />}
    </div>
  );
}

function ClassCard({ cls, config, canManage }: { cls: GroupClass; config?: CalendarConfig; canManage: boolean }) {
  const [adding, setAdding] = useState(false);
  const [leaving, setLeaving] = useState<ClassMember | null>(null);
  const [extending, setExtending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const updateSeries = useUpdateSeries();
  const free = cls.places - cls.members.length;

  const assignPhysio = (physioId: string) =>
    updateSeries.mutate(
      { seriesId: cls.id, scope: "all", changes: { physioId } },
      {
        onSuccess: ({ updated, skipped }) =>
          toast.success(`Fisio asignado a ${updated.length} sesiones`, {
            description: skipped.length
              ? `No se pudo en ${skipped.length}: ${skipped.map((s) => `${dayLabel(s.date)} (${s.message})`).join(", ")}`
              : undefined,
          }),
        onError: (e) => toast.error("No se pudo asignar el fisio", { description: e.message }),
      },
    );

  return (
    <section className="flex flex-col gap-4 rounded-[1.75rem] border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-lg font-medium">
            <span className="size-3 rounded-full" style={{ backgroundColor: cls.service.color }} />
            {cls.service.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {weekdaysLabel(cls.weekdays)} · {cls.startTime} · {cls.room.name} · {cls.physio?.name ?? "sin fisio"}
          </p>
          <p className="text-xs text-muted-foreground">
            {cls.upcomingSessions > 0
              ? `${cls.upcomingSessions} sesiones por delante · hasta el ${shortDate(cls.endsOn)}`
              : `Terminó el ${shortDate(cls.endsOn)}`}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setAdding((v) => !v)}>
              <UserPlus /> Inscribir
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setExtending(true)}>
              <CalendarPlus /> Ampliar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-8 rounded-full" aria-label={`Más opciones de ${cls.service.name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(true)} disabled={!config}>
                  <Pencil /> Editar clase
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
                  <Trash2 /> Eliminar clase
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {cls.sessionsWithoutPhysio > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <TriangleAlert className="size-4 text-amber-600 dark:text-amber-400" />
          <span className="flex-1">
            {cls.sessionsWithoutPhysio === cls.upcomingSessions
              ? "Esta clase no tiene fisio asignado."
              : `${cls.sessionsWithoutPhysio} sesiones sin fisio asignado.`}
          </span>
          {canManage && config && (
            <NativeSelect
              aria-label="Asignar fisio"
              value=""
              disabled={updateSeries.isPending}
              onChange={(e) => e.target.value && assignPhysio(e.target.value)}
              className="w-48 bg-card"
            >
              <NativeSelectOption value="">Asignar fisio…</NativeSelectOption>
              {config.professionals.map((p) => (
                <NativeSelectOption key={p.userId} value={p.userId}>
                  {p.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </div>
      )}

      {adding && <AddMemberForm cls={cls} onDone={() => setAdding(false)} />}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Alumnos ({cls.members.length} de {cls.places})
          {free <= 0 && <span className="ml-2 text-xs font-normal text-destructive">completa</span>}
        </span>
        {cls.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nadie inscrito todavía.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {cls.members.map((m) => (
              <li key={m.id} className="flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-sm">
                <span>
                  {m.firstName} {m.lastName}
                </span>
                {m.toDate && <span className="text-xs text-muted-foreground">· hasta el {dayLabel(m.toDate)}</span>}
                {canManage && !m.toDate && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-6 rounded-full" aria-label={`Opciones de ${m.firstName}`}>
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem variant="destructive" onSelect={() => setLeaving(m)}>
                        Dar de baja
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <LeaveDialog cls={cls} member={leaving} onClose={() => setLeaving(null)} />
      {extending && <ExtendDialog cls={cls} onClose={() => setExtending(false)} />}
      {editing && config && <EditClassDialog cls={cls} config={config} onClose={() => setEditing(false)} />}
      {deleting && <DeleteClassDialog cls={cls} onClose={() => setDeleting(false)} />}
    </section>
  );
}

function AddMemberForm({ cls, onDone }: { cls: GroupClass; onDone: () => void }) {
  const [patient, setPatient] = useState<AppointmentPatientInput>({ firstName: "", lastName: "" });
  const [fromDate, setFromDate] = useState(today());
  const add = useAddClassMember();
  const ready = !!patient.patientId || (!!patient.firstName.trim() && !!patient.lastName.trim());
  return (
    <form
      className="flex flex-col gap-3 rounded-xl border p-3"
      onSubmit={(e) => {
        e.preventDefault();
        add.mutate(
          {
            classId: cls.id,
            patient: patient.patientId
              ? { patientId: patient.patientId, firstName: "", lastName: "" }
              : { ...patient, firstName: patient.firstName.trim(), lastName: patient.lastName.trim() },
            fromDate,
          },
          {
            onSuccess: ({ added, full }) => {
              toast.success(`Inscrito en ${added.length} sesiones`, {
                description: full.length ? `Sin plaza en ${full.length}: ${summary(full)}` : undefined,
              });
              onDone();
            },
            onError: (err) => toast.error("No se pudo inscribir", { description: err.message }),
          },
        );
      }}
    >
      <PatientFields value={patient} onChange={setPatient} label="Alumno nuevo" autoFocus disabled={add.isPending} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`from-${cls.id}`}>Desde</Label>
          <Input id={`from-${cls.id}`} type="date" min={today()} value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-44" />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="rounded-full" onClick={onDone} disabled={add.isPending}>
            Cancelar
          </Button>
          <Button type="submit" className="rounded-full" disabled={!ready || add.isPending}>
            {add.isPending && <Loader2 className="animate-spin" />}
            Inscribir
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Se añade a todas las sesiones de la clase desde ese día que tengan plaza.</p>
    </form>
  );
}

function LeaveDialog({ cls, member, onClose }: { cls: GroupClass; member: ClassMember | null; onClose: () => void }) {
  const [fromDate, setFromDate] = useState(today());
  const remove = useRemoveClassMember();
  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Dar de baja</DialogTitle>
          <DialogDescription>
            {member?.firstName} {member?.lastName} deja de ir a {cls.service.name} ({weekdaysLabel(cls.weekdays).toLowerCase()}, {cls.startTime}).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="leave-from">A partir del día</Label>
          <Input id="leave-from" type="date" min={today()} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Se le quita de las sesiones desde ese día. Si alguna estaba cobrada queda «a revisar» en Cobros; si era con bono,
            la sesión vuelve al bono.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose} disabled={remove.isPending}>
            Volver
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            disabled={remove.isPending}
            onClick={() =>
              member &&
              remove.mutate(
                { classId: cls.id, memberId: member.id, fromDate },
                {
                  onSuccess: ({ removed }) => {
                    toast.success(`Baja hecha: quitado de ${removed.length} sesiones`);
                    onClose();
                  },
                  onError: (e) => toast.error("No se pudo dar de baja", { description: e.message }),
                },
              )
            }
          >
            {remove.isPending && <Loader2 className="animate-spin" />}
            Dar de baja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExtendDialog({ cls, onClose }: { cls: GroupClass; onClose: () => void }) {
  const [endsOn, setEndsOn] = useState(addDays(cls.endsOn, 7 * 8));
  const extend = useExtendClass();
  return (
    <Dialog open onOpenChange={(open) => !open && !extend.isPending && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ampliar la clase</DialogTitle>
          <DialogDescription>Ahora termina el {shortDate(cls.endsOn)}. Se crean las sesiones nuevas con los alumnos inscritos.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="extend-until">Hasta</Label>
          <Input id="extend-until" type="date" min={addDays(cls.endsOn, 1)} value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose} disabled={extend.isPending}>
            Cancelar
          </Button>
          <Button
            className="rounded-full"
            disabled={extend.isPending || endsOn <= cls.endsOn}
            onClick={() =>
              extend.mutate(
                { classId: cls.id, endsOn },
                {
                  onSuccess: ({ created, skipped }) => {
                    toast.success(`${created.length} sesiones nuevas`, {
                      description: skipped.length ? `No se crearon ${skipped.length}: ${skipped.map((s) => `${dayLabel(s.date)} (${s.message})`).join(", ")}` : undefined,
                    });
                    onClose();
                  },
                  onError: (e) => toast.error("No se pudo ampliar", { description: e.message }),
                },
              )
            }
          >
            {extend.isPending && <Loader2 className="animate-spin" />}
            Ampliar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewClassDialog({ config, onClose }: { config: CalendarConfig; onClose: () => void }) {
  const groupServices = config.services.filter((s) => s.isGroup);
  const first = groupServices[0];
  const [form, setForm] = useState<ClassInput>({
    serviceId: first?.id ?? "",
    roomId: config.rooms.find((r) => !first?.roomTypeId || r.roomTypeId === first.roomTypeId)?.id ?? "",
    physioId: null,
    startTime: "19:00",
    weekdays: [2, 4],
    startsOn: today(),
    endsOn: addDays(today(), 7 * 12),
  });
  const [preview, setPreview] = useState<SeriesDay[] | null>(null);
  const [checking, setChecking] = useState(false);
  const create = useCreateClass();
  const set = <K extends keyof ClassInput>(k: K, v: ClassInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const ok = !!form.serviceId && !!form.roomId && form.weekdays.length > 0 && form.endsOn >= form.startsOn;
  const okDays = preview?.filter((d) => d.ok).length ?? 0;

  const check = async () => {
    setChecking(true);
    try {
      setPreview(await previewClass(form));
    } catch (e) {
      toast.error("No se pudieron comprobar las fechas", { description: (e as Error).message });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !create.isPending && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{preview ? "Revisa las fechas" : "Nueva clase"}</DialogTitle>
          <DialogDescription>
            {preview
              ? `Se crearán ${okDays} de ${preview.length} sesiones. Después inscribe a los alumnos.`
              : "Una clase de grupo que se repite cada semana."}
          </DialogDescription>
        </DialogHeader>

        {preview ? (
          <ul className="flex max-h-80 flex-col divide-y overflow-y-auto rounded-xl border text-sm">
            {preview.map((d) => (
              <li key={d.date} className={cn("flex items-center gap-3 px-3 py-2", !d.ok && "bg-muted/40")}>
                {d.ok ? <CircleCheck className="size-4 shrink-0 text-primary" /> : <CircleX className="size-4 shrink-0 text-destructive" />}
                <span className="w-28 shrink-0 first-letter:uppercase">{dayLabel(d.date)}</span>
                <span className="text-muted-foreground">{d.ok ? form.startTime : d.message}</span>
              </li>
            ))}
          </ul>
        ) : groupServices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay servicios en grupo. Crea uno en Configuración → Servicios (marca «En grupo»).
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="class-service">Servicio</Label>
                <NativeSelect id="class-service" value={form.serviceId} onChange={(e) => set("serviceId", e.target.value)} className="w-full">
                  {groupServices.map((s) => (
                    <NativeSelectOption key={s.id} value={s.id}>
                      {s.name} (hasta {s.maxPatients})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="class-room">Sala</Label>
                <NativeSelect id="class-room" value={form.roomId} onChange={(e) => set("roomId", e.target.value)} className="w-full">
                  {config.rooms.map((r) => (
                    <NativeSelectOption key={r.id} value={r.id}>
                      {r.name} ({r.capacity} plazas)
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="class-physio">Fisio</Label>
              <NativeSelect id="class-physio" value={form.physioId ?? ""} onChange={(e) => set("physioId", e.target.value || null)} className="w-full">
                <NativeSelectOption value="">Sin asignar todavía</NativeSelectOption>
                {config.professionals.map((p) => (
                  <NativeSelectOption key={p.userId} value={p.userId}>
                    {p.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {!form.physioId && (
                <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                  <TriangleAlert className="size-3.5" /> Se crea sin fisio: asígnalo después desde esta página.
                </p>
              )}
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
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="class-time">Hora</Label>
                <Input id="class-time" type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="class-from">Desde</Label>
                <Input id="class-from" type="date" min={today()} value={form.startsOn} onChange={(e) => set("startsOn", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="class-to">Hasta</Label>
                <Input id="class-to" type="date" min={form.startsOn} max={addDays(form.startsOn, 183)} value={form.endsOn} onChange={(e) => set("endsOn", e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Como mucho 6 meses; se puede ampliar después.</p>
          </div>
        )}

        <DialogFooter>
          {preview ? (
            <>
              <Button variant="outline" className="rounded-full" onClick={() => setPreview(null)} disabled={create.isPending}>
                Volver
              </Button>
              <Button
                className="rounded-full"
                disabled={okDays === 0 || create.isPending}
                onClick={() =>
                  create.mutate(form, {
                    onSuccess: ({ created, skipped }) => {
                      toast.success(`Clase creada: ${created.length} sesiones`, {
                        description: skipped.length ? `No se crearon ${skipped.length}: ${skipped.map((s) => `${dayLabel(s.date)} (${s.message})`).join(", ")}` : undefined,
                      });
                      onClose();
                    },
                    onError: (e) => toast.error("No se pudo crear la clase", { description: e.message }),
                  })
                }
              >
                {create.isPending && <Loader2 className="animate-spin" />}
                Crear clase
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="rounded-full" onClick={onClose}>
                Cancelar
              </Button>
              <Button className="rounded-full" disabled={!ok || checking || groupServices.length === 0} onClick={check}>
                {checking && <Loader2 className="animate-spin" />}
                Ver fechas
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
