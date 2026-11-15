import { toast } from "sonner";
import type { ClinicFeature } from "@/adapters/api";
import { useSetClinicFeature } from "@/adapters/hook";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { clinicFeatures } from "@/lib/features";

type Props = {
  clinicId: string;
  // The features switched on for this clinic
  enabled: ClinicFeature[];
};

// Optional features of the clinic. Each one is saved as soon as it's ticked
export default function ClinicFeatures({ clinicId, enabled }: Props) {
  const setFeature = useSetClinicFeature();

  const toggle = (feature: ClinicFeature, label: string, on: boolean) =>
    setFeature.mutate(
      { clinicId, feature, enabled: on },
      {
        onSuccess: () =>
          toast.success(on ? `${label} activada` : `${label} desactivada`),
        onError: (error) =>
          toast.error("No se pudo cambiar la funcionalidad", {
            description: error.message,
          }),
      },
    );

  return (
    <section className="grid gap-6 rounded-[1.75rem] border bg-card p-6 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">Funcionalidades</h2>
        <p className="text-sm text-muted-foreground">
          Extras que se activan clínica a clínica. Se guardan al marcarlos.
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-5">
        {clinicFeatures.map(({ key, label, description }) => {
          // While saving, show the value being saved
          const saving = setFeature.isPending && setFeature.variables.feature === key;
          const checked = saving ? setFeature.variables.enabled : enabled.includes(key);
          return (
            <div key={key} className="flex items-start gap-3">
              <Checkbox
                id={`feature-${key}`}
                checked={checked}
                disabled={setFeature.isPending}
                onCheckedChange={(value) => toggle(key, label, value === true)}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-1">
                <Label htmlFor={`feature-${key}`}>{label}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
