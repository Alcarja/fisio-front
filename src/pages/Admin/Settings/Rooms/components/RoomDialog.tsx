import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Room, RoomInput, RoomType } from "@/adapters/api";
import { useCreateRoom, useUpdateRoom } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

const MAX_CAPACITY = 100; // same as the backend

type Props = {
  // Leave out to create a new room
  room?: Room;
  roomTypes: RoomType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const toForm = (room?: Room) => ({
  name: room?.name ?? "",
  capacity: String(room?.capacity ?? 1),
  roomTypeId: room?.roomTypeId ?? "",
  description: room?.description ?? "",
});

// Create or edit a room: name, capacity, type and description
export default function RoomDialog({ room, roomTypes, open, onOpenChange }: Props) {
  const isEdit = !!room;
  const [form, setForm] = useState(() => toForm(room));
  const create = useCreateRoom();
  const update = useUpdateRoom();
  const pending = create.isPending || update.isPending;

  const capacity = Number(form.capacity);
  const capacityOk = Number.isInteger(capacity) && capacity >= 1 && capacity <= MAX_CAPACITY;

  const close = (next: boolean) => {
    if (!next && pending) return;
    onOpenChange(next);
    if (!next) setForm(toForm(room));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!capacityOk) return;
    const data: RoomInput = {
      name: form.name.trim(),
      capacity,
      roomTypeId: form.roomTypeId || null,
      description: form.description.trim() || null,
    };
    const callbacks = {
      onSuccess: () => {
        toast.success(isEdit ? "Sala actualizada" : "Sala creada", { description: data.name });
        close(false);
      },
      onError: (error: Error) =>
        toast.error(isEdit ? "No se pudo guardar la sala" : "No se pudo crear la sala", {
          description: error.message,
        }),
    };
    if (isEdit) update.mutate({ roomId: room.id, changes: data }, callbacks);
    else create.mutate(data, callbacks);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar sala" : "Nueva sala"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Cambia los datos de la sala." : "Añade una sala donde atender a pacientes."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="room-name">Nombre</Label>
              <Input
                id="room-name"
                required
                autoFocus
                placeholder="Sala 1, Gimnasio…"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="room-capacity">Capacidad</Label>
                <Input
                  id="room-capacity"
                  type="number"
                  required
                  min={1}
                  max={MAX_CAPACITY}
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  aria-invalid={!capacityOk}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="room-type">Tipo</Label>
                <NativeSelect
                  id="room-type"
                  value={form.roomTypeId}
                  onChange={(e) => setForm((f) => ({ ...f, roomTypeId: e.target.value }))}
                  className="w-full"
                >
                  <NativeSelectOption value="">Sin tipo</NativeSelectOption>
                  {roomTypes.map((t) => (
                    <NativeSelectOption key={t.id} value={t.id}>
                      {t.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <p className="col-span-2 text-xs text-muted-foreground">
                Capacidad: cuántas personas pueden estar a la vez (1 para sesiones individuales).
                {roomTypes.length === 0 && " Puedes crear tipos de sala más abajo."}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="room-description">
                Descripción <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="room-description"
                placeholder="Equipamiento u otros detalles"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={pending}
              onClick={() => close(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="rounded-full" disabled={!capacityOk || pending}>
              {pending && <Loader2 className="animate-spin" />}
              {isEdit ? "Guardar" : "Crear sala"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
