import { useState } from "react";
import {
  ClipboardList,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { Room, RoomType, Service } from "@/adapters/api";
import { useDeleteService, useUpdateService } from "@/adapters/hook";
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
import { formatMinutes, formatPrice } from "../serviceFormat";
import ServiceDialog from "./ServiceDialog";

type Props = {
  services: Service[];
  roomTypes: RoomType[];
  rooms: Room[];
};

// The clinic's services: create, edit, activate/deactivate and delete.
// Active ones first, then inactive ones
export default function ServicesSection({ services, roomTypes, rooms }: Props) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const update = useUpdateService();
  const remove = useDeleteService();

  const sorted = [...services].sort(
    (a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name),
  );

  const toggleActive = (service: Service) =>
    update.mutate(
      { serviceId: service.id, changes: { isActive: !service.isActive } },
      {
        onSuccess: () =>
          toast.success(service.isActive ? "Servicio desactivado" : "Servicio activado", {
            description: service.isActive
              ? `${service.name} ya no se podrá reservar.`
              : `${service.name} vuelve a estar disponible.`,
          }),
        onError: (error) =>
          toast.error("No se pudo cambiar el servicio", { description: error.message }),
      },
    );

  const confirmDelete = () => {
    if (!deleting) return;
    const service = deleting;
    remove.mutate(service.id, {
      onSuccess: () => {
        toast.success("Servicio eliminado", { description: service.name });
        setDeleting(null);
      },
      onError: (error) => {
        toast.error("No se pudo eliminar el servicio", { description: error.message });
        setDeleting(null);
      },
    });
  };

  return (
    <SettingsSection
      title="Servicios"
      description="Los tratamientos que ofrece tu clínica: duración, precio y dónde se hacen."
      action={
        <Button type="button" size="sm" className="rounded-full" onClick={() => setCreating(true)}>
          <Plus /> Añadir servicio
        </Button>
      }
    >
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          <ClipboardList className="size-5" />
          Todavía no hay servicios. Añade el primero para poder dar citas.
        </div>
      ) : (
        <ul className="flex flex-col divide-y">
          {sorted.map((service) => (
            <li
              key={service.id}
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0",
                !service.isActive && "opacity-60",
              )}
            >
              {/* Calendar color */}
              <span
                className="h-9 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: service.color }}
                aria-hidden
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 truncate text-sm font-medium">
                  {service.name}
                  {!service.isActive && (
                    <Badge variant="outline" className="text-[10px]">
                      Inactivo
                    </Badge>
                  )}
                </span>
                <span className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {formatMinutes(service.durationMinutes)}
                    {service.bufferMinutes > 0 && ` + ${service.bufferMinutes} min limpieza`}
                  </span>
                  <span>{service.roomTypeName ?? "Cualquier sala"}</span>
                </span>
              </div>
              {service.isGroup && (
                <Badge variant="secondary" className="gap-1">
                  <Users className="size-3" /> Grupo · hasta {service.maxPatients}
                </Badge>
              )}
              <span className="w-20 text-right text-sm font-medium tabular-nums">
                {formatPrice(service.priceCents)}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label={`Acciones para ${service.name}`}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
                  <DropdownMenuItem className="gap-2 rounded-lg" onSelect={() => setEditing(service)}>
                    <Pencil /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 rounded-lg" onSelect={() => toggleActive(service)}>
                    {service.isActive ? <PowerOff /> : <Power />}
                    {service.isActive ? "Desactivar" : "Activar"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuItem
                    variant="destructive"
                    className="gap-2 rounded-lg"
                    onSelect={() => setDeleting(service)}
                  >
                    <Trash2 /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <ServiceDialog
        roomTypes={roomTypes}
        rooms={rooms}
        open={creating}
        onOpenChange={setCreating}
      />

      {/* Edit: key so the form starts from that service */}
      {editing && (
        <ServiceDialog
          key={editing.id}
          service={editing}
          roomTypes={roomTypes}
          rooms={rooms}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`¿Eliminar ${deleting?.name ?? "el servicio"}?`}
        description="Si ya tiene citas, no se podrá eliminar: desactívalo en su lugar para que no se pueda reservar más."
        confirmLabel="Eliminar servicio"
        onConfirm={confirmDelete}
        pending={remove.isPending}
      />
    </SettingsSection>
  );
}
