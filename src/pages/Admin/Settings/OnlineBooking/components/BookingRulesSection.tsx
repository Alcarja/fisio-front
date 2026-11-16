import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { BookingRules } from "@/adapters/api";
import { useUpdateBookingRules } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import SettingsSection from "../../components/SettingsSection";

const MAX_POLICY = 1000; // same as the backend

type Option = { value: number; label: string };

const noticeOptions: Option[] = [
  { value: 0, label: "Sin antelación mínima" },
  { value: 60, label: "1 hora antes" },
  { value: 120, label: "2 horas antes" },
  { value: 240, label: "4 horas antes" },
  { value: 720, label: "12 horas antes" },
  { value: 1440, label: "24 horas antes" },
  { value: 2880, label: "2 días antes" },
  { value: 4320, label: "3 días antes" },
];

const daysAheadOptions: Option[] = [
  { value: 7, label: "1 semana" },
  { value: 14, label: "2 semanas" },
  { value: 30, label: "1 mes" },
  { value: 60, label: "2 meses" },
  { value: 90, label: "3 meses" },
  { value: 180, label: "6 meses" },
];

const stepOptions: Option[] = [
  { value: 15, label: "Cada 15 minutos" },
  { value: 20, label: "Cada 20 minutos" },
  { value: 30, label: "Cada 30 minutos" },
  { value: 60, label: "Cada hora" },
];

const cancelNoticeOptions: Option[] = [
  { value: 0, label: "Hasta la hora de la cita" },
  { value: 2, label: "Hasta 2 horas antes" },
  { value: 6, label: "Hasta 6 horas antes" },
  { value: 12, label: "Hasta 12 horas antes" },
  { value: 24, label: "Hasta 24 horas antes" },
  { value: 48, label: "Hasta 2 días antes" },
  { value: 72, label: "Hasta 3 días antes" },
];

type SelectProps = {
  id: string;
  label: string;
  hint: string;
  value: number;
  options: Option[];
  onChange: (value: number) => void;
  disabled?: boolean;
};

// A value saved from elsewhere (not in the list) still shows
function RuleSelect({ id, label, hint, value, options, onChange, disabled }: SelectProps) {
  const known = options.some((o) => o.value === value);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full sm:max-w-xs"
      >
        {!known && <NativeSelectOption value={value}>{value}</NativeSelectOption>}
        {options.map((o) => (
          <NativeSelectOption key={o.value} value={o.value}>
            {o.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

type Props = {
  rules: BookingRules;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // same as the backend

// The clinic's booking and cancellation criteria for online bookings, and
// where it's told about them. Saved
// all at once. Render with a key that changes when the data reloads
export default function BookingRulesSection({ rules }: Props) {
  const [form, setForm] = useState(rules);
  const save = useUpdateBookingRules();
  const set = <K extends keyof BookingRules>(key: K, value: BookingRules[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const policy = form.policyText ?? "";
  const notifyEmail = form.notifyEmail ?? "";
  const notifyEmailOk = !notifyEmail.trim() || EMAIL_PATTERN.test(notifyEmail.trim());
  const cleaned: BookingRules = {
    ...form,
    policyText: policy.trim() || null,
    notifyEmail: notifyEmail.trim().toLowerCase() || null,
  };
  const isDirty = JSON.stringify(cleaned) !== JSON.stringify(rules);
  const pending = save.isPending;

  const handleSave = () =>
    save.mutate(cleaned, {
      onSuccess: () => toast.success("Criterios guardados"),
      onError: (error) =>
        toast.error("No se pudieron guardar los criterios", { description: error.message }),
    });

  return (
    <SettingsSection
      title="Criterios y avisos"
      description="Las condiciones para quien reserva online y a quién se avisa. No afectan a las citas que dais desde la agenda."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-5">
          <h3 className="text-sm font-medium">Reservar</h3>
          <RuleSelect
            id="rule-min-notice"
            label="Antelación mínima"
            hint="Lo más tarde que alguien puede reservar una hora libre."
            value={form.minNoticeMinutes}
            options={noticeOptions}
            onChange={(v) => set("minNoticeMinutes", v)}
            disabled={pending}
          />
          <RuleSelect
            id="rule-days-ahead"
            label="Con cuánta antelación como máximo"
            hint="Hasta cuándo se ven horas libres en la página de reservas."
            value={form.maxDaysAhead}
            options={daysAheadOptions}
            onChange={(v) => set("maxDaysAhead", v)}
            disabled={pending}
          />
          <RuleSelect
            id="rule-step"
            label="Horas de inicio"
            hint="Cada cuánto se ofrece una hora: 09:00, 09:30, 10:00…"
            value={form.slotStepMinutes}
            options={stepOptions}
            onChange={(v) => set("slotStepMinutes", v)}
            disabled={pending}
          />
        </div>

        <div className="flex flex-col gap-5 border-t pt-6">
          <h3 className="text-sm font-medium">Cancelar</h3>
          <div className="flex items-start gap-3">
            <Checkbox
              id="rule-cancel-enabled"
              checked={form.cancelEnabled}
              disabled={pending}
              onCheckedChange={(value) => set("cancelEnabled", value === true)}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-1">
              <Label htmlFor="rule-cancel-enabled">El paciente puede cancelar online</Label>
              <p className="text-xs text-muted-foreground">
                Con el enlace que recibe por email al reservar. Si lo desactivas, tendrá que
                llamaros para cancelar.
              </p>
            </div>
          </div>
          {form.cancelEnabled && (
            <RuleSelect
              id="rule-cancel-notice"
              label="Plazo para cancelar"
              hint="Pasado este plazo, el enlace ya no deja cancelar y le pide que os llame."
              value={form.cancelNoticeHours}
              options={cancelNoticeOptions}
              onChange={(v) => set("cancelNoticeHours", v)}
              disabled={pending}
            />
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="rule-policy">
              Texto para el paciente{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="rule-policy"
              rows={4}
              maxLength={MAX_POLICY}
              placeholder="Por ejemplo: las citas canceladas con menos de 24 horas se cobran. Trae ropa cómoda."
              value={policy}
              onChange={(e) => set("policyText", e.target.value)}
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              Se muestra antes de confirmar la reserva, en el email de confirmación y en la página
              de la cita.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t pt-6">
          <h3 className="text-sm font-medium">Avisos</h3>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rule-notify-email">
              Email de avisos{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="rule-notify-email"
              type="email"
              maxLength={200}
              placeholder="recepcion@tuclinica.com"
              value={notifyEmail}
              onChange={(e) => set("notifyEmail", e.target.value)}
              disabled={pending}
              aria-invalid={!notifyEmailOk}
              className="w-full sm:max-w-xs"
            />
            {notifyEmailOk ? (
              <p className="text-xs text-muted-foreground">
                Recibe un email por cada reserva o cancelación online. También es donde llegan las
                respuestas del paciente a su email de confirmación. Si lo dejas vacío, no se avisa
                a nadie: las reservas se ven solo en la agenda.
              </p>
            ) : (
              <p role="alert" className="text-xs text-destructive">
                Este email no es válido.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
          {isDirty && (
            <span className="text-sm text-muted-foreground sm:mr-auto">
              Tienes cambios sin guardar.
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={!isDirty || pending}
            onClick={() => setForm(rules)}
          >
            Descartar
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={!isDirty || !notifyEmailOk || pending}
            onClick={handleSave}
          >
            {pending && <Loader2 className="animate-spin" />}
            Guardar criterios
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
