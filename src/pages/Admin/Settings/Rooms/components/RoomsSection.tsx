import { useState } from "react";
import {
  DoorOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { Room, RoomType } from "@/adapters/api";
import { useDeleteRoom, useUpdateRoom } from "@/adapters/hook";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import SettingsSection from "../../components/SettingsSection";
import RoomDialog from "./RoomDialog";

type Props = {
  rooms: Room[];
  roomTypes: RoomType[];
};

// The clinic's rooms: create, edit, activate/deactivate and delete.
// Active rooms first, then inactive ones
export default function RoomsSection({ rooms, roomTypes }: Props) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const update = useUpdateRoom();
  const remove = useDeleteRoom();

  const sorted = [...rooms].sort(
    (a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name),
  );

  const toggleActive = (room: Room) =>
    update.mutate(
      { roomId: room.id, changes: { isActive: !room.isActive } },
      {
        onSuccess: () =>
          toast.success(room.isActive ? "Sala desactivada" : "Sala activada", {
            description: room.isActive
              ? `${room.name} ya no se podrá usar en nuevas citas.`
              : `${room.name} vuelve a estar disponible.`,
          }),
        onError: (error) =>
          toast.error("No se pudo cambiar la sala", { description: error.message }),
      },
    );

  const confirmDelete = () => {
    if (!deleting) return;
    const room = deleting;
    remove.mutate(room.id, {
      onSuccess: () => {
        toast.success("Sala eliminada", { description: room.name });
        setDeleting(null);
      },
      onError: (error) => {
        toast.error("No se pudo eliminar la sala", { description: error.message });
        setDeleting(null);
      },
    });
  };

  return (
    <SettingsSection
      title="Salas"
      description="Dónde se atiende a los pacientes y cuántas personas caben en cada una."
      action={
        <Button type="button" size="sm" className="rounded-full" onClick={() => setCreating(true)}>
          <Plus /> Añadir sala
        </Button>
      }
    >
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          <DoorOpen className="size-5" />
          Todavía no hay salas. Añade la primera para poder dar citas.
        </div>
      ) : (
        <ul className="flex flex-col divide-y">
          {sorted.map((room) => (
            <li
              key={room.id}
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0",
                !room.isActive && "opacity-60",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <DoorOpen className="size-4 text-primary" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 truncate text-sm font-medium">
                  {room.name}
                  {!room.isActive && (
                    <Badge variant="outline" className="text-[10px]">
                      Inactiva
                    </Badge>
                  )}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {[room.roomTypeName ?? "Sin tipo", room.description].filter(Boolean).join(" · ")}
                </span>
              </div>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="size-3.5" />
                {room.capacity === 1 ? "1 persona" : `${room.capacity} personas`}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label={`Acciones para ${room.name}`}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
                  <DropdownMenuItem className="gap-2 rounded-lg" onSelect={() => setEditing(room)}>
                    <Pencil /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 rounded-lg" onSelect={() => toggleActive(room)}>
                    {room.isActive ? <PowerOff /> : <Power />}
                    {room.isActive ? "Desactivar" : "Activar"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuItem
                    variant="destructive"
                    className="gap-2 rounded-lg"
                    onSelect={() => setDeleting(room)}
                  >
                    <Trash2 /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      {/* New room */}
      <RoomDialog roomTypes={roomTypes} open={creating} onOpenChange={setCreating} />

      {/* Edit: key so the form starts from that room */}
      {editing && (
        <RoomDialog
          key={editing.id}
          room={editing}
          roomTypes={roomTypes}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`¿Eliminar ${deleting?.name ?? "la sala"}?`}
        description="Se borrará la sala con su horario propio y sus bloqueos. Si ya tiene citas, no se podrá eliminar: desactívala en su lugar."
        confirmLabel="Eliminar sala"
        onConfirm={confirmDelete}
        pending={remove.isPending}
      />
    </SettingsSection>
  );
}
