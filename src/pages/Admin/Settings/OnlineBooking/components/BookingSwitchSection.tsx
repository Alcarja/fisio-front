import { toast } from "sonner";
import { useSetOnlineBookingEnabled } from "@/adapters/hook";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import SettingsSection from "../../components/SettingsSection";

type Props = {
  enabled: boolean;
};

// The clinic's own switch. Saved as soon as it's ticked
export default function BookingSwitchSection({ enabled }: Props) {
  const setEnabled = useSetOnlineBookingEnabled();
  // While saving, show the value being saved
  const checked = setEnabled.isPending ? setEnabled.variables : enabled;

  const toggle = (on: boolean) =>
    setEnabled.mutate(on, {
      onSuccess: () => toast.success(on ? "Reserva online activada" : "Reserva online desactivada"),
      onError: (error) =>
        toast.error("No se pudo cambiar la reserva online", { description: error.message }),
    });

  return (
    <SettingsSection
      title="Reserva online"
      description="Deja que tus pacientes pidan cita ellos mismos, con un enlace o un QR."
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id="online-booking-enabled"
          checked={checked}
          disabled={setEnabled.isPending}
          onCheckedChange={(value) => toggle(value === true)}
          className="mt-0.5"
        />
        <div className="flex flex-col gap-1">
          <Label htmlFor="online-booking-enabled">Aceptar reservas online</Label>
          <p className="text-xs text-muted-foreground">
            Si la desactivas, nadie podrá reservar online. El horario de cada profesional se
            conserva para cuando vuelvas a activarla.
          </p>
        </div>
      </div>
    </SettingsSection>
  );
}
