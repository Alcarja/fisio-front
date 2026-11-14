import { CircleAlert, Loader2 } from "lucide-react";
import { useClinicRooms, useClinicServices, useMe } from "@/adapters/hook";
import ServicesSection from "./components/ServicesSection";

// Configuración → Servicios (CALENDARIO.md, section 3): the active clinic's
// services. Uses the rooms too (room types to pick, capacities to warn).
// Backend: /clinic/settings/services (back/src/routes/service.routes.ts)
export default function ServicesPage() {
  const { data: me } = useMe();
  const clinicId = me?.activeClinic?.clinicId;
  const services = useClinicServices(clinicId);
  const rooms = useClinicRooms(clinicId);

  if (services.isPending || rooms.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!services.data || !rooms.data) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      >
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        {(services.error ?? rooms.error)?.message ?? "No se pudieron cargar los servicios"}
      </div>
    );
  }

  return (
    <ServicesSection
      services={services.data}
      roomTypes={rooms.data.roomTypes}
      rooms={rooms.data.rooms}
    />
  );
}
