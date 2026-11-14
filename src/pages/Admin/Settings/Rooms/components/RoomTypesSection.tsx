import { useState, type FormEvent } from "react";
import { Check, Loader2, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { RoomType } from "@/adapters/api";
import { useCreateRoomType, useDeleteRoomType, useRenameRoomType } from "@/adapters/hook";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SettingsSection from "../../components/SettingsSection";

type Props = {
  roomTypes: RoomType[];
};

// Kinds of room (camilla, gimnasio, piscina…). Services will require a type,
// so they can only be booked in a matching room
export default function RoomTypesSection({ roomTypes }: Props) {
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<RoomType | null>(null);
  const create = useCreateRoomType();
  const rename = useRenameRoomType();
  const remove = useDeleteRoomType();

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    create.mutate(name, {
      onSuccess: () => {
        toast.success("Tipo de sala creado", { description: name });
        setNewName("");
      },
      onError: (error) => toast.error("No se pudo crear el tipo", { description: error.message }),
    });
  };

  const saveRename = () => {
    if (!renaming || !renaming.name.trim()) return;
    rename.mutate(
      { id: renaming.id, name: renaming.name.trim() },
      {
        onSuccess: () => {
          toast.success("Tipo de sala renombrado");
          setRenaming(null);
        },
        onError: (error) => toast.error("No se pudo renombrar", { description: error.message }),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const type = deleting;
    remove.mutate(type.id, {
      onSuccess: () => {
        toast.success("Tipo de sala eliminado", { description: type.name });
        setDeleting(null);
      },
      onError: (error) => {
        toast.error("No se pudo eliminar el tipo", { description: error.message });
        setDeleting(null);
      },
    });
  };

  return (
    <SettingsSection
      title="Tipos de sala"
      description="Agrupa las salas por lo que tienen (camilla, gimnasio…). Los servicios podrán exigir un tipo."
    >
      <div className="flex flex-col gap-4">
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nuevo tipo, p. ej. Camilla"
            aria-label="Nombre del nuevo tipo de sala"
            disabled={create.isPending}
          />
          <Button
            type="submit"
            variant="outline"
            className="shrink-0 rounded-full"
            disabled={!newName.trim() || create.isPending}
          >
            {create.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            Añadir
          </Button>
        </form>

        {roomTypes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            <Tags className="size-5" />
            Sin tipos de sala. Son opcionales.
          </div>
        ) : (
          <ul className="flex flex-col divide-y">
            {roomTypes.map((type) => {
              const isRenaming = renaming?.id === type.id;
              return (
                <li key={type.id} className="flex items-center gap-2 py-2.5 first:pt-0 last:pb-0">
                  {isRenaming ? (
                    <>
                      <Input
                        autoFocus
                        value={renaming.name}
                        onChange={(e) => setRenaming({ id: type.id, name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename();
                          if (e.key === "Escape") setRenaming(null);
                        }}
                        aria-label={`Nuevo nombre para ${type.name}`}
                        disabled={rename.isPending}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 rounded-full"
                        onClick={saveRename}
                        disabled={!renaming.name.trim() || rename.isPending}
                        aria-label="Guardar nombre"
                      >
                        {rename.isPending ? <Loader2 className="animate-spin" /> : <Check />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 rounded-full"
                        onClick={() => setRenaming(null)}
                        disabled={rename.isPending}
                        aria-label="Cancelar"
                      >
                        <X />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate text-sm font-medium">{type.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {type.roomCount === 1 ? "1 sala" : `${type.roomCount} salas`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-muted-foreground"
                        onClick={() => setRenaming({ id: type.id, name: type.name })}
                        aria-label={`Renombrar ${type.name}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleting(type)}
                        aria-label={`Eliminar ${type.name}`}
                      >
                        <Trash2 />
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`¿Eliminar el tipo ${deleting?.name ?? ""}?`}
        description={
          deleting && deleting.roomCount > 0
            ? `${deleting.roomCount === 1 ? "1 sala se quedará" : `${deleting.roomCount} salas se quedarán`} sin tipo, igual que los servicios que lo usen.`
            : "Los servicios que lo usen se quedarán sin tipo."
        }
        confirmLabel="Eliminar tipo"
        onConfirm={confirmDelete}
        pending={remove.isPending}
      />
    </SettingsSection>
  );
}
