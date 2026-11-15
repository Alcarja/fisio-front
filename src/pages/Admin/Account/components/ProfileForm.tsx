import { useState, type FormEvent } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import type { Me } from "@/adapters/api";
import { useUpdateProfile } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormError from "./FormError";

const MAX_NAME_LENGTH = 80;

// Name (editable) and email (read only: it's the login and what invitations
// are matched against, so changing it needs a verified flow we don't have yet)
export default function ProfileForm({ user }: { user: Me["user"] }) {
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(user.name);

  const trimmed = name.trim();
  const changed = trimmed !== user.name;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed || !changed) return;
    updateProfile.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setName(trimmed);
          toast.success("Datos guardados");
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="account-name">Nombre y apellidos</Label>
        <Input
          id="account-name"
          autoComplete="name"
          required
          maxLength={MAX_NAME_LENGTH}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-xl bg-background px-4 text-base md:text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Es el nombre que ve tu equipo en la agenda y en las citas.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="account-email">Email</Label>
        <div className="relative">
          <Input
            id="account-email"
            type="email"
            value={user.email}
            readOnly
            aria-describedby="account-email-hint"
            className="h-11 rounded-xl bg-muted/50 pr-11 pl-4 text-base text-muted-foreground md:text-sm"
          />
          <Lock className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <p id="account-email-hint" className="text-xs text-muted-foreground">
          Es tu usuario para entrar. Si necesitas cambiarlo, pídeselo a soporte.
        </p>
      </div>

      {updateProfile.error && <FormError>{updateProfile.error.message}</FormError>}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={!changed || !trimmed || updateProfile.isPending}
          className="h-10 rounded-full px-5"
        >
          {updateProfile.isPending && <Loader2 className="animate-spin" />}
          Guardar cambios
        </Button>
        {changed && !updateProfile.isPending && (
          <Button
            type="button"
            variant="ghost"
            className="h-10 rounded-full px-4"
            onClick={() => {
              setName(user.name);
              updateProfile.reset();
            }}
          >
            Descartar
          </Button>
        )}
      </div>
    </form>
  );
}
