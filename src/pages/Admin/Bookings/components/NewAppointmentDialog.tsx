import { toast } from "sonner";
import type { CalendarConfig } from "@/adapters/api";
import { useCreateAppointment } from "@/adapters/hook";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AppointmentForm, { type AppointmentFormValues } from "./AppointmentForm";

type Props = {
  config: CalendarConfig;
  date: string; // suggested day ("2026-11-16")
  startTime: string; // suggested time ("09:00")
  // Physios book only for themselves: their user id. Leave out for everyone else
  lockedPhysioId?: string;
  onClose: () => void;
};

// "Nueva reserva": creates an appointment. If a rule fails (closed, room full,
// physio busy…) the backend's message is shown and the form stays open
export default function NewAppointmentDialog({
  config,
  date,
  startTime,
  lockedPhysioId,
  onClose,
}: Props) {
  const create = useCreateAppointment();

  // Sensible defaults: first service, its first fitting room, first professional
  const service = config.services[0];
  const room = config.rooms.find((r) => !service?.roomTypeId || r.roomTypeId === service.roomTypeId);
  const initial: AppointmentFormValues = {
    serviceId: service?.id ?? "",
    date,
    startTime,
    physioId: lockedPhysioId ?? config.professionals[0]?.userId ?? "",
    roomId: room?.id ?? "",
    patients: [],
    status: "booked",
    notes: "",
  };

  const handleSubmit = (values: AppointmentFormValues) =>
    create.mutate(
      {
        serviceId: values.serviceId,
        roomId: values.roomId,
        physioId: values.physioId,
        date: values.date,
        startTime: values.startTime,
        patients: values.patients,
        status: values.status === "confirmed" ? "confirmed" : "booked",
        notes: values.notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Cita creada");
          onClose();
        },
        onError: (error) => toast.error("No se pudo crear la cita", { description: error.message }),
      },
    );

  return (
    <Dialog open onOpenChange={(open) => !open && !create.isPending && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
          <DialogDescription>Crea una cita en el calendario de tu clínica.</DialogDescription>
        </DialogHeader>
        <AppointmentForm
          config={config}
          initial={initial}
          statuses={["booked", "confirmed"]}
          submitLabel="Crear cita"
          pending={create.isPending}
          lockedPhysioId={lockedPhysioId}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
