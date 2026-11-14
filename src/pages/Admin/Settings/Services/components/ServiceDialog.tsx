import { useState, type FormEvent } from "react";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import type { Room, RoomType, Service, ServiceInput } from "@/adapters/api";
import { useCreateService, useUpdateService } from "@/adapters/hook";
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
import { cn } from "@/lib/utils";
import { centsToInput, inputToCents, serviceColors } from "../serviceFormat";

// Same limits as the backend (durations go in 5-minute steps here)
const MIN_DURATION = 5;
const MAX_DURATION = 480;
const MAX_BUFFER = 120;
const MAX_GROUP_PATIENTS = 100;

type Props = {
  // Leave out to create a new service
  service?: Service;
  roomTypes: RoomType[];
  rooms: Room[]; // to warn when no room fits a group
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const toForm = (s?: Service) => ({
  name: s?.name ?? "",
  durationMinutes: String(s?.durationMinutes ?? 45),
  bufferMinutes: String(s?.bufferMinutes ?? 0),
  price: s ? centsToInput(s.priceCents) : "",
  roomTypeId: s?.roomTypeId ?? "",
  isGroup: s?.isGroup ?? false,
  maxPatients: String(s && s.isGroup ? s.maxPatients : 4),
  color: s?.color ?? serviceColors[0]!,
});

const intBetween = (value: string, min: number, max: number) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

// Create or edit a service
export default function ServiceDialog({ service, roomTypes, rooms, open, onOpenChange }: Props) {
  const isEdit = !!service;
  const [form, setForm] = useState(() => toForm(service));
  const create = useCreateService();
  const update = useUpdateService();
  const pending = create.isPending || update.isPending;

  const set = <K extends keyof ReturnType<typeof toForm>>(
    key: K,
    value: ReturnType<typeof toForm>[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  // Validation (same rules as the backend)
  const duration = intBetween(form.durationMinutes, MIN_DURATION, MAX_DURATION);
  const buffer = intBetween(form.bufferMinutes, 0, MAX_BUFFER);
  const priceCents = inputToCents(form.price);
  const maxPatients = form.isGroup ? intBetween(form.maxPatients, 2, MAX_GROUP_PATIENTS) : 1;
  const valid =
    !!form.name.trim() &&
    duration !== null &&
    buffer !== null &&
    priceCents !== null &&
    maxPatients !== null;

  // Group bigger than every suitable active room: warn (appointments would never fit)
  const suitableRooms = rooms.filter(
    (r) => r.isActive && (!form.roomTypeId || r.roomTypeId === form.roomTypeId),
  );
  const biggestRoom = Math.max(0, ...suitableRooms.map((r) => r.capacity));
  const groupTooBig = form.isGroup && maxPatients !== null && maxPatients > biggestRoom;

  const close = (next: boolean) => {
    if (!next && pending) return;
    onOpenChange(next);
    if (!next) setForm(toForm(service));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    const data: ServiceInput = {
      name: form.name.trim(),
      durationMinutes: duration,
      bufferMinutes: buffer,
      priceCents,
      roomTypeId: form.roomTypeId || null,
      isGroup: form.isGroup,
      maxPatients,
      color: form.color,
    };
    const callbacks = {
      onSuccess: () => {
        toast.success(isEdit ? "Servicio actualizado" : "Servicio creado", {
          description: data.name,
        });
        close(false);
      },
      onError: (error: Error) =>
        toast.error(isEdit ? "No se pudo guardar el servicio" : "No se pudo crear el servicio", {
          description: error.message,
        }),
    };
    if (isEdit) update.mutate({ serviceId: service.id, changes: data }, callbacks);
    else create.mutate(data, callbacks);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Cambia los datos del servicio." : "Un tratamiento que se puede reservar."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="service-name">Nombre</Label>
              <Input
                id="service-name"
                required
                autoFocus
                placeholder="Fisioterapia, Pilates…"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

            {/* Time and price */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="service-duration">Duración (min)</Label>
                {/* The browser counts steps from `min`: min 5 + step 5 = 5, 10… 50 */}
                <Input
                  id="service-duration"
                  type="number"
                  required
                  min={MIN_DURATION}
                  max={MAX_DURATION}
                  step={5}
                  value={form.durationMinutes}
                  onChange={(e) => set("durationMinutes", e.target.value)}
                  aria-invalid={duration === null}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="service-buffer">Limpieza (min)</Label>
                <Input
                  id="service-buffer"
                  type="number"
                  min={0}
                  max={MAX_BUFFER}
                  step={5}
                  value={form.bufferMinutes}
                  onChange={(e) => set("bufferMinutes", e.target.value)}
                  aria-invalid={buffer === null}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="service-price">Precio (€)</Label>
                <Input
                  id="service-price"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  aria-invalid={priceCents === null}
                />
              </div>
              <p className="col-span-3 text-xs text-muted-foreground">
                La limpieza es el tiempo que la sala queda ocupada después de cada cita.
              </p>
            </div>

            {/* Room type */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="service-room-type">Tipo de sala</Label>
              <NativeSelect
                id="service-room-type"
                value={form.roomTypeId}
                onChange={(e) => set("roomTypeId", e.target.value)}
                className="w-full"
              >
                <NativeSelectOption value="">Cualquier sala</NativeSelectOption>
                {roomTypes.map((t) => (
                  <NativeSelectOption key={t.id} value={t.id}>
                    {t.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">
                Solo se podrá reservar en salas de este tipo.
                {roomTypes.length === 0 && " Los tipos se crean en la pestaña Salas."}
              </p>
            </div>

            {/* Individual or group */}
            <div className="flex flex-col gap-2">
              <Label>Modalidad</Label>
              <div role="radiogroup" aria-label="Modalidad" className="grid grid-cols-2 gap-2">
                {[
                  { value: false, label: "Individual", hint: "Un paciente por cita." },
                  { value: true, label: "En grupo", hint: "Varios pacientes a la vez." },
                ].map((option) => {
                  const selected = form.isGroup === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => set("isGroup", option.value)}
                      className={cn(
                        "flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-colors",
                        selected ? "border-primary bg-secondary" : "hover:bg-muted",
                      )}
                    >
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.hint}</span>
                    </button>
                  );
                })}
              </div>
              {form.isGroup && (
                <div className="flex flex-col gap-2 pt-1">
                  <Label htmlFor="service-max">Máximo de pacientes</Label>
                  <Input
                    id="service-max"
                    type="number"
                    min={2}
                    max={MAX_GROUP_PATIENTS}
                    value={form.maxPatients}
                    onChange={(e) => set("maxPatients", e.target.value)}
                    aria-invalid={maxPatients === null}
                    className="w-28"
                  />
                  {groupTooBig && (
                    <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                      <TriangleAlert className="mt-px size-3.5 shrink-0" />
                      {biggestRoom === 0
                        ? "Todavía no hay ninguna sala activa adecuada para este servicio."
                        : `La sala adecuada más grande admite ${biggestRoom} personas: no cabrán más en cada cita.`}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Color */}
            <div className="flex flex-col gap-2">
              <Label>Color en el calendario</Label>
              <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
                {serviceColors.map((color) => {
                  const selected = form.color.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={color}
                      onClick={() => set("color", color)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow",
                        selected ? "ring-2 ring-foreground" : "hover:ring-2 hover:ring-border",
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {selected && <Check className="size-4 text-white" />}
                    </button>
                  );
                })}
              </div>
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
            <Button type="submit" className="rounded-full" disabled={!valid || pending}>
              {pending && <Loader2 className="animate-spin" />}
              {isEdit ? "Guardar" : "Crear servicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
