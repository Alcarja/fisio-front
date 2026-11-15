import { useState } from "react";
import { Check, Ellipsis, Loader2, Mail, Phone, Reply, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { ContactRequestItem } from "@/adapters/api";
import { useDeleteContactRequest, useSetContactRequestHandled } from "@/adapters/hook";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const time = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });
const day = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
const dayYear = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

// "hoy, 10:30" · "ayer, 18:05" · "12 nov, 09:15" · "3 ene 2025"
function formatWhen(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(today) - startOf(date)) / 86_400_000);
  if (days === 0) return `hoy, ${time.format(date)}`;
  if (days === 1) return `ayer, ${time.format(date)}`;
  if (date.getFullYear() === today.getFullYear()) {
    return `${day.format(date).replace(".", "")}, ${time.format(date)}`;
  }
  return dayYear.format(date).replace(".", "");
}

// Opens the mail app with the answer started
const replyHref = (r: ContactRequestItem) =>
  `mailto:${r.email}?subject=${encodeURIComponent(`Kineflow para ${r.clinicName}`)}&body=${encodeURIComponent(
    `Hola, ${r.name.split(/\s+/)[0]}:\n\nGracias por escribirnos.\n\n`,
  )}`;

// One request: who wrote, how to reach them, their message, and what to do
// with it. Marking as answered can be undone from the toast
export default function RequestCard({ request: r }: { request: ContactRequestItem }) {
  const setHandled = useSetContactRequestHandled();
  const remove = useDeleteContactRequest();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const changeHandled = (handled: boolean, undo = true) =>
    setHandled.mutate(
      { id: r.id, handled },
      {
        onSuccess: () => {
          if (!undo) return;
          toast.success(handled ? "Marcada como respondida" : "Vuelve a pendientes", {
            action: { label: "Deshacer", onClick: () => changeHandled(!handled, false) },
          });
        },
        onError: (error) => toast.error("No se pudo guardar", { description: error.message }),
      },
    );

  const deleteRequest = () =>
    remove.mutate(r.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        toast.success("Solicitud eliminada");
      },
      onError: (error) => toast.error("No se pudo eliminar", { description: error.message }),
    });

  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-[1.75rem] border p-5 sm:p-6",
        r.handled ? "bg-muted/30" : "bg-card",
      )}
    >
      <div className="flex items-start gap-3">
        {!r.handled && (
          <span className="mt-2 size-2 shrink-0 rounded-full bg-coral" aria-label="Pendiente" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-medium">{r.clinicName}</span>
          <span className="truncate text-sm text-muted-foreground">{r.name}</span>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground" title={new Date(r.createdAt).toLocaleString("es-ES")}>
          {formatWhen(r.createdAt)}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <a
          href={`mailto:${r.email}`}
          className="flex min-w-0 items-center gap-2 underline-offset-4 hover:underline"
        >
          <Mail className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{r.email}</span>
        </a>
        {r.phone && (
          <a
            href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}
            className="flex items-center gap-2 underline-offset-4 hover:underline"
          >
            <Phone className="size-4 text-muted-foreground" /> {r.phone}
          </a>
        )}
        {r.teamSize && (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4" /> {r.teamSize}
          </span>
        )}
      </div>

      {r.message ? (
        <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-line">
          {r.message}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">Sin mensaje.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" className="h-9 rounded-full px-4">
          <a href={replyHref(r)}>
            <Reply /> Responder
          </a>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={r.handled ? "secondary" : "outline"}
          aria-pressed={r.handled}
          disabled={setHandled.isPending}
          onClick={() => changeHandled(!r.handled)}
          className={cn("h-9 rounded-full px-4", r.handled && "text-primary")}
          title={r.handled ? "Volver a marcar como pendiente" : undefined}
        >
          {setHandled.isPending ? <Loader2 className="animate-spin" /> : r.handled && <Check />}
          {r.handled ? "Respondida" : "Marcar como respondida"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto rounded-full"
              aria-label={`Más opciones de la solicitud de ${r.clinicName}`}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
            <DropdownMenuItem
              variant="destructive"
              className="gap-2 rounded-lg"
              onSelect={() => setConfirmDelete(true)}
            >
              <Trash2 /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar esta solicitud?"
        description={`La solicitud de ${r.clinicName} se borrará para siempre. Úsalo para el spam; si ya la has contestado, mejor márcala como respondida.`}
        confirmLabel="Eliminar"
        onConfirm={deleteRequest}
        pending={remove.isPending}
      />
    </li>
  );
}
