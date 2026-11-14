import { useState, type FormEvent } from "react";
import { CircleAlert, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { NewClinic } from "@/adapters/api";
import { useCreateClinic } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const empty = { name: "", slug: "", logo: "", ownerEmail: "" };

// "Clínica Sol & Mar" -> "clinica-sol-mar"
// Pass keepTrailingHyphen while the user types in the slug field itself,
// otherwise they could never type a "-"
function slugify(text: string, keepTrailingHyphen = false) {
  const slug = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "");
  return keepTrailingHyphen ? slug : slug.replace(/-+$/, "");
}

export default function CreateClinicDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  // Keep the slug in sync with the name until the user edits it by hand
  const [slugEdited, setSlugEdited] = useState(false);

  const createClinic = useCreateClinic();

  const reset = () => {
    setForm(empty);
    setSlugEdited(false);
    createClinic.reset(); // clear any previous error
  };

  const handleOpenChange = (next: boolean) => {
    // Don't let the dialog close mid-request
    if (!next && createClinic.isPending) return;
    setOpen(next);
    if (!next) reset();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clinic: NewClinic = {
      name: form.name.trim(),
      slug: form.slug,
      ...(form.logo.trim() && { logo: form.logo.trim() }),
      ownerEmail: form.ownerEmail.trim(),
    };
    createClinic.mutate(clinic, {
      // The hook already refreshes the clinics list
      onSuccess: (created) => {
        handleOpenChange(false);
        toast.success(`${created.name} creada`, {
          description: `Invitación de propietario enviada a ${clinic.ownerEmail}.`,
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus /> Nueva clínica
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Nueva clínica</DialogTitle>
            <DialogDescription>
              Da de alta una clínica en la plataforma.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="clinic-name">Nombre</Label>
              <Input
                id="clinic-name"
                required
                autoFocus
                placeholder="Clínica Sol"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: slugEdited ? f.slug : slugify(name) }));
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="clinic-slug">URL</Label>
              <Input
                id="clinic-slug"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="Solo minúsculas, números y guiones"
                placeholder="clinica-sol"
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setForm((f) => ({ ...f, slug: slugify(e.target.value, true) }));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Se usará como identificador único de la clínica.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="clinic-logo">
                Logo <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="clinic-logo"
                type="url"
                placeholder="https://…/logo.png"
                value={form.logo}
                onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              <Label htmlFor="clinic-owner-email">Email del propietario</Label>
              <Input
                id="clinic-owner-email"
                type="email"
                required
                autoComplete="off"
                placeholder="propietario@clinica.com"
                value={form.ownerEmail}
                onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Le enviaremos una invitación. Será el propietario cuando la acepte.
              </p>
            </div>
          </div>

          {createClinic.error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {createClinic.error.message}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={createClinic.isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="rounded-full" disabled={createClinic.isPending}>
              {createClinic.isPending ? (
                <>
                  <Loader2 className="animate-spin" /> Creando…
                </>
              ) : (
                "Crear clínica"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
