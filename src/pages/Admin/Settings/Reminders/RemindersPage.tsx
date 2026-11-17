import { useState } from "react";
import { CircleAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ReminderSettings } from "@/adapters/api";
import {
  useMe,
  useReminders,
  useSetRemindersEnabled,
  useUpdateReminderSettings,
} from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import SettingsSection from "../components/SettingsSection";

// Configuración → Recordatorios: the clinic's own switch, when reminders are
// sent and what they say. Only in clinics where a superadmin switched the
// "reminders" feature on (router: remindersAccess).
// Backend: /clinic/settings/reminders (back/src/routes/reminder.routes.ts)
export default function RemindersPage() {
  const { data: me } = useMe();
  const { data, isPending, error } = useReminders(me?.activeClinic?.clinicId);

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
      <SwitchSection enabled={data.enabled} />
      {/* key: start the form again from the saved data after each save */}
      <SettingsForm key={JSON.stringify(data.settings)} settings={data.settings} />
      <WhoSection />
    </div>
  );
}

// The clinic's own switch. Saved as soon as it's ticked
function SwitchSection({ enabled }: { enabled: boolean }) {
  const setEnabled = useSetRemindersEnabled();
  const checked = setEnabled.isPending ? setEnabled.variables : enabled;

  const toggle = (on: boolean) =>
    setEnabled.mutate(on, {
      onSuccess: () =>
        toast.success(on ? "Recordatorios activados" : "Recordatorios desactivados"),
      onError: (error) =>
        toast.error("No se pudieron cambiar los recordatorios", { description: error.message }),
    });

  return (
    <SettingsSection
      title="Recordatorios"
      description="Un email a cada paciente antes de su cita, para que no se le olvide."
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id="reminders-enabled"
          checked={checked}
          disabled={setEnabled.isPending}
          onCheckedChange={(value) => toggle(value === true)}
          className="mt-0.5"
        />
        <div className="flex flex-col gap-1">
          <Label htmlFor="reminders-enabled">Enviar recordatorios</Label>
          <p className="text-xs text-muted-foreground">
            Se envían solos, en nombre de la clínica, a las citas reservadas o confirmadas. Las
            citas que no recibirán recordatorio se marcan en la agenda.
          </p>
        </div>
      </div>
    </SettingsSection>
  );
}

const hoursOptions = [2, 4, 12, 24, 48, 72];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // same as the backend
const MAX_EXTRA = 500; // same as the backend

// When they're sent and what they say. Saved all at once
function SettingsForm({ settings }: { settings: ReminderSettings }) {
  const [form, setForm] = useState(settings);
  const save = useUpdateReminderSettings();
  const set = <K extends keyof ReminderSettings>(key: K, value: ReminderSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const replyTo = form.replyTo ?? "";
  const extraText = form.extraText ?? "";
  const replyToOk = !replyTo.trim() || EMAIL_PATTERN.test(replyTo.trim());
  const cleaned: ReminderSettings = {
    ...form,
    replyTo: replyTo.trim().toLowerCase() || null,
    extraText: extraText.trim() || null,
  };
  const isDirty = JSON.stringify(cleaned) !== JSON.stringify(settings);
  const pending = save.isPending;

  const handleSave = () =>
    save.mutate(cleaned, {
      onSuccess: () => toast.success("Recordatorios guardados"),
      onError: (error) =>
        toast.error("No se pudieron guardar los recordatorios", { description: error.message }),
    });

  return (
    <SettingsSection
      title="Cuándo y qué"
      description="Cuándo sale el email y qué dice. Nunca incluye datos de salud."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Label>Cuándo se envía</Label>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="radio"
              name="reminder-timing"
              className="accent-primary"
              checked={form.timing === "day_before"}
              disabled={pending}
              onChange={() => set("timing", "day_before")}
            />
            El día anterior a las
            <Input
              type="time"
              aria-label="Hora de envío"
              value={form.sendTime}
              disabled={pending || form.timing !== "day_before"}
              onChange={(e) => set("sendTime", e.target.value)}
              className="w-28"
            />
          </label>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="radio"
              name="reminder-timing"
              className="accent-primary"
              checked={form.timing === "hours_before"}
              disabled={pending}
              onChange={() => set("timing", "hours_before")}
            />
            <NativeSelect
              aria-label="Horas antes"
              value={form.hoursBefore}
              disabled={pending || form.timing !== "hours_before"}
              onChange={(e) => set("hoursBefore", Number(e.target.value))}
              className="w-40"
            >
              {!hoursOptions.includes(form.hoursBefore) && (
                <NativeSelectOption value={form.hoursBefore}>{form.hoursBefore} horas</NativeSelectOption>
              )}
              {hoursOptions.map((h) => (
                <NativeSelectOption key={h} value={h}>
                  {h} horas
                </NativeSelectOption>
              ))}
            </NativeSelect>
            antes de la cita
          </label>
          <p className="text-xs text-muted-foreground">
            Las citas dadas después de ese momento no lo reciben: quien acaba de reservar ya lo
            sabe. Si una cita cambia de hora, se envía otro con la hora nueva.
          </p>
        </div>

        <div className="flex items-start gap-3 border-t pt-6">
          <Checkbox
            id="reminder-service"
            checked={form.includeService}
            disabled={pending}
            onCheckedChange={(value) => set("includeService", value === true)}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="reminder-service">Incluir el nombre del servicio</Label>
            <p className="text-xs text-muted-foreground">
              Desactivado, el email solo dice el día, la hora y con quién. Algunos nombres de
              servicio dicen algo de la salud del paciente («Suelo pélvico»), y un email lo puede
              ver otra persona.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t pt-6">
          <Label htmlFor="reminder-reply-to">
            Email para respuestas <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="reminder-reply-to"
            type="email"
            maxLength={200}
            placeholder="recepcion@tuclinica.com"
            value={replyTo}
            onChange={(e) => set("replyTo", e.target.value)}
            disabled={pending}
            aria-invalid={!replyToOk}
            className="w-full sm:max-w-xs"
          />
          {replyToOk ? (
            <p className="text-xs text-muted-foreground">
              Si el paciente responde al recordatorio, le llega aquí. Vacío: el email de avisos de la
              reserva online, si lo tenéis.
            </p>
          ) : (
            <p role="alert" className="text-xs text-destructive">
              Este email no es válido.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reminder-extra">
            Texto al final <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Textarea
            id="reminder-extra"
            rows={3}
            maxLength={MAX_EXTRA}
            placeholder="Por ejemplo: estamos en Calle Mayor 1, 2.º B. Trae ropa cómoda."
            value={extraText}
            onChange={(e) => set("extraText", e.target.value)}
            disabled={pending}
          />
          <p className="text-xs text-muted-foreground">
            La dirección, qué traer, cómo avisar si no puedes venir… No escribas nada sobre
            tratamientos.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
          {isDirty && (
            <span className="text-sm text-muted-foreground sm:mr-auto">Tienes cambios sin guardar.</span>
          )}
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={!isDirty || pending}
            onClick={() => setForm(settings)}
          >
            Descartar
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={!isDirty || !replyToOk || !form.sendTime || pending}
            onClick={handleSave}
          >
            {pending && <Loader2 className="animate-spin" />}
            Guardar
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}

// Where the email comes from, so nobody is surprised by a patient without one
function WhoSection() {
  return (
    <SettingsSection
      title="A quién se envía"
      description="A cada paciente de la cita que tenga email."
    >
      <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
        <li>
          <strong className="font-medium text-foreground">Reserva online:</strong> el email que el
          paciente escribió al reservar.
        </li>
        <li>
          <strong className="font-medium text-foreground">Paciente con ficha:</strong> el email de
          su ficha. Si se cambia en la ficha, el recordatorio va al nuevo.
        </li>
        <li>
          <strong className="font-medium text-foreground">Solo nombre:</strong> el email que
          escribáis al dar la cita, si lo hacéis. Es opcional.
        </li>
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">
        Las citas en las que algún paciente no recibirá recordatorio llevan una campana tachada en
        la agenda.
      </p>
    </SettingsSection>
  );
}
