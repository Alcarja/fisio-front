import { useState } from "react";
import { Wallet } from "lucide-react";
import { useChargesArchive, useMe } from "@/adapters/hook";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { hasFeature } from "@/lib/roles";
import ExportButton from "../../Charges/components/ExportButton";
import { formatMonth } from "../reportUtils";

// Cobros switched off (the clinic stopped using it) but with payments recorded:
// owners and admins can still download them month by month for their
// accountant. Clinics have to keep these records for years
export default function ChargesArchiveCard() {
  const { data: me } = useMe();
  const off = !hasFeature(me, "invoicing");
  const { data: months } = useChargesArchive(me?.activeClinic?.clinicId, off);
  const [month, setMonth] = useState("");

  if (!off || !months || months.length === 0) return null;
  const chosen = month || months[0]!;

  return (
    <section className="flex flex-col gap-4 rounded-[1.75rem] border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Wallet className="size-4 text-primary" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">Cobros anteriores</h2>
          <p className="text-sm text-muted-foreground">
            Cobros y bonos ya no está activo en tu clínica, pero puedes descargar los cobros que registraste para tu
            gestoría.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <NativeSelect aria-label="Mes" value={chosen} onChange={(e) => setMonth(e.target.value)} className="w-48">
          {months.map((m) => (
            <NativeSelectOption key={m} value={m}>
              {formatMonth(new Date(`${m}-15T12:00:00`))}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <ExportButton month={chosen} clinicName={me?.activeClinic?.clinicName ?? "clinica"} label="Descargar" />
      </div>
    </section>
  );
}
