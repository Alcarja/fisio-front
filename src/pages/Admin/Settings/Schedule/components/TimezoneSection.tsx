import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateClinicTimezone } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import SettingsSection from "../../components/SettingsSection";

// Zones offered. Value = IANA name stored in organization.timezone
const timezones = [
  { value: "Europe/Madrid", label: "Península y Baleares (Madrid)" },
  { value: "Atlantic/Canary", label: "Canarias" },
  { value: "Europe/Lisbon", label: "Portugal (Lisboa)" },
];

type Props = {
  timezone: string;
};

// The clinic's time zone: appointments are stored in UTC and shown in this zone
export default function TimezoneSection({ timezone }: Props) {
  const [value, setValue] = useState(timezone);
  const save = useUpdateClinicTimezone();

  const isKnown = timezones.some((t) => t.value === value);
  const isDirty = value !== timezone;

  const handleSave = () =>
    save.mutate(value, {
      onSuccess: () => toast.success("Zona horaria guardada"),
      onError: (error) =>
        toast.error("No se pudo guardar la zona horaria", { description: error.message }),
    });

  return (
    <SettingsSection
      title="Zona horaria"
      description="Las horas del horario y de las citas se muestran en esta zona."
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="clinic-timezone">Zona horaria</Label>
          <NativeSelect
            id="clinic-timezone"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={save.isPending}
            className="w-full sm:max-w-xs"
          >
            {timezones.map((t) => (
              <NativeSelectOption key={t.value} value={t.value}>
                {t.label}
              </NativeSelectOption>
            ))}
            {/* A zone set elsewhere still shows */}
            {!isKnown && <NativeSelectOption value={value}>{value}</NativeSelectOption>}
          </NativeSelect>
        </div>
        <Button
          type="button"
          className="rounded-full"
          disabled={!isDirty || save.isPending}
          onClick={handleSave}
        >
          {save.isPending && <Loader2 className="animate-spin" />}
          Guardar
        </Button>
      </div>
    </SettingsSection>
  );
}
