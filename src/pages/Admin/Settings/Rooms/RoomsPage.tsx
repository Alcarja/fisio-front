import { CalendarClock, CircleAlert, Loader2 } from "lucide-react";
import { useClinicRooms, useMe } from "@/adapters/hook";
import SectionPlaceholder from "../components/SectionPlaceholder";
import RoomTypesSection from "./components/RoomTypesSection";
import RoomsSection from "./components/RoomsSection";

// Configuración → Salas (CALENDARIO.md, section 2): rooms and room types of
// the active clinic. Backend: /clinic/settings/rooms (back/src/routes/room.routes.ts)
export default function RoomsPage() {
  const { data: me } = useMe();
  const { data, isPending, error } = useClinicRooms(me?.activeClinic?.clinicId);

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
      <RoomsSection rooms={data.rooms} roomTypes={data.roomTypes} />
      <RoomTypesSection roomTypes={data.roomTypes} />
      {/* Next step (tables room_opening_hours and room_block already exist) */}
      <SectionPlaceholder
        icon={CalendarClock}
        title="Horario propio y bloqueos"
        description="Para salas que no abren todo el horario de la clínica."
        items={[
          "Horario propio de una sala, siempre dentro del horario de la clínica. Sin horario propio, sigue el de la clínica.",
          "Bloqueos puntuales: una sala no disponible un día u horas concretas (mantenimiento).",
        ]}
      />
    </div>
  );
}
