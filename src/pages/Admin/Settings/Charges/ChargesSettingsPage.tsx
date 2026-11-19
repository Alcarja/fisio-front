import { useState } from "react";
import { CircleAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ChargeSettings } from "@/adapters/api";
import { useChargeSettings, useMe, useUpdateChargeSettings } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SettingsSection from "../components/SettingsSection";
import BonoTypesSection from "./BonoTypesSection";

// Configuración → Cobros: from which day sessions count and whether no-shows
// are charged. Owners and admins, in clinics with the "invoicing" feature
// (router: chargesManagerAccess). Backend: /clinic/charges/settings
export default function ChargesSettingsPage() {
  const { data: me } = useMe();
  const { data, isPending, error } = useChargeSettings(me?.activeClinic?.clinicId);

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
      {/* key: start the form again from the saved data after each save */}
      <SettingsForm key={JSON.stringify(data)} settings={data} />
      <BonoTypesSection />
    </div>
  );
}

function SettingsForm({ settings }: { settings: ChargeSettings }) {
  const [form, setForm] = useState(settings);
  const save = useUpdateChargeSettings();
  const pending = save.isPending;
  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(form.startsOn) && form.startsOn >= "2000-01-01";

  const handleSave = () =>
    save.mutate(form, {
      onSuccess: () => toast.success("Ajustes de cobros guardados"),
      onError: (error) =>
        toast.error("No se pudieron guardar los ajustes", { description: error.message }),
    });

  return (
    <SettingsSection
      title="Cobros"
      description="Qué sesiones cuentan para cobrar. No son facturas: las facturas las sigue haciendo tu gestoría o tu programa."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="charges-starts-on">Contar sesiones desde</Label>
          <Input
            id="charges-starts-on"
            type="date"
            value={form.startsOn}
            disabled={pending}
            aria-invalid={!dateOk}
            onChange={(e) => setForm((f) => ({ ...f, startsOn: e.target.value }))}
            className="w-full sm:max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            Las sesiones anteriores no aparecen como pendientes de cobro. Por defecto, el día en que
            se activaron los cobros en tu clínica.
          </p>
        </div>

        <div className="flex items-start gap-3 border-t pt-6">
          <Checkbox
            id="charges-no-shows"
            checked={form.chargeNoShows}
            disabled={pending}
            onCheckedChange={(value) => setForm((f) => ({ ...f, chargeNoShows: value === true }))}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="charges-no-shows">Cobrar las faltas</Label>
            <p className="text-xs text-muted-foreground">
              Si el paciente no se presenta, la sesión queda pendiente de cobro y, si tiene bono,
              gasta una sesión. Desactivado, las faltas no generan cargo. Las citas canceladas nunca
              lo generan.
            </p>
          </div>
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
            disabled={!isDirty || !dateOk || pending}
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
