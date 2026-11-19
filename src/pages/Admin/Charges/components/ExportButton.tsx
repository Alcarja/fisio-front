import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportChargesMonth } from "@/adapters/api";
import { Button } from "@/components/ui/button";
import { fileSlug } from "../../Patients/patientExport";
import { formatMonth } from "../../Reports/reportUtils";

type Props = {
  month: string; // "YYYY-MM"
  clinicName: string;
  label?: string;
};

// Downloads a month's payments as a CSV for the accountant, who makes the
// invoices from it. Owners and admins only (it has NIF and addresses). Also
// works with Cobros switched off (Informes → Cobros anteriores)
export default function ExportButton({ month, clinicName, label = "Exportar para el gestor" }: Props) {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      const blob = await exportChargesMonth(month);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cobros-${fileSlug(clinicName)}-${month}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success(`Cobros de ${formatMonth(new Date(`${month}-15T12:00:00`))} descargados`, {
        description:
          "Llevan nombre, NIF y dirección de los pacientes: compártelos solo con tu gestoría, con la que debes tener firmado el encargo del tratamiento.",
      });
    } catch (error) {
      toast.error("No se pudo exportar", { description: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      variant="outline"
      className="rounded-full"
      onClick={download}
      disabled={busy}
      title="Un archivo para Excel con los cobros y devoluciones del mes, para que tu gestoría haga las facturas"
    >
      {busy ? <Loader2 className="animate-spin" /> : <Download />}
      {label}
    </Button>
  );
}
