import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import {
  useChangePassword,
  useLoginMethods,
  useRequestPasswordEmail,
} from "@/adapters/hook";
import type { Me } from "@/adapters/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormError from "./FormError";

// Same minimum as the backend (Better Auth emailAndPassword.minPasswordLength)
const MIN_PASSWORD_LENGTH = 10;

const inputClass = "h-11 rounded-xl bg-background pl-4 text-base md:text-sm";

// Change the password (asks for the current one). Accounts without a password
// (Google only) get a button that emails a link to create one instead
export default function PasswordForm({ user }: { user: Me["user"] }) {
  const { data: methods, isPending, error } = useLoginMethods(user.id);

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) return <FormError>{error.message}</FormError>;

  const hasPassword = methods.some((m) => m.providerId === "credential");
  if (hasPassword) return <ChangePassword />;
  // Super-admins never get password emails (back/src/auth.ts): only from the server
  if (user.role === "superadmin") {
    return (
      <p className="text-sm text-muted-foreground">
        Por seguridad, la contraseña de un superadmin solo se puede crear desde el servidor.
      </p>
    );
  }
  return <CreatePassword email={user.email} />;
}

function ChangePassword() {
  const changePassword = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (next !== confirm) return setProblem("Las contraseñas nuevas no coinciden");
    if (next === current) return setProblem("La nueva contraseña debe ser distinta de la actual");
    setProblem(null);
    changePassword.mutate(
      { currentPassword: current, newPassword: next, revokeOtherSessions: signOutOthers },
      {
        onSuccess: () => {
          setCurrent("");
          setNext("");
          setConfirm("");
          setShow(false);
          toast.success("Contraseña cambiada", {
            description: signOutOthers
              ? "Hemos cerrado tu sesión en los demás dispositivos."
              : undefined,
          });
        },
      },
    );
  };

  const message = problem ?? changePassword.error?.message;
  const toggle = (
    <button
      type="button"
      onClick={() => setShow((s) => !s)}
      aria-label={show ? "Ocultar contraseñas" : "Mostrar contraseñas"}
      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
    >
      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="current-password">Contraseña actual</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={`${inputClass} pr-11`}
          />
          {toggle}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-password">Nueva contraseña</Label>
          <Input
            id="new-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            aria-describedby="new-password-hint"
            className={`${inputClass} pr-4`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-password">Repite la nueva</Label>
          <Input
            id="confirm-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={`${inputClass} pr-4`}
          />
        </div>
        <p id="new-password-hint" className="-mt-3 text-xs text-muted-foreground sm:col-span-2 sm:mt-0">
          Mínimo {MIN_PASSWORD_LENGTH} caracteres.
        </p>
      </div>

      <div className="flex items-start gap-2.5">
        <Checkbox
          id="sign-out-others"
          checked={signOutOthers}
          onCheckedChange={(checked) => setSignOutOthers(checked === true)}
          className="mt-0.5"
        />
        <Label htmlFor="sign-out-others" className="flex flex-col items-start gap-0.5 font-normal">
          <span className="text-sm">Cerrar sesión en los demás dispositivos</span>
          <span className="text-xs text-muted-foreground">
            Recomendado si crees que alguien más conoce tu contraseña.
          </span>
        </Label>
      </div>

      {message && <FormError>{message}</FormError>}

      <div>
        <Button
          type="submit"
          disabled={changePassword.isPending || !current || !next || !confirm}
          className="h-10 rounded-full px-5"
        >
          {changePassword.isPending && <Loader2 className="animate-spin" />}
          Cambiar contraseña
        </Button>
      </div>
    </form>
  );
}

function CreatePassword({ email }: { email: string }) {
  const requestEmail = useRequestPasswordEmail();

  if (requestEmail.isSuccess) {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-secondary/60 p-4 text-sm">
        <MailCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Te hemos enviado un enlace a <span className="font-medium">{email}</span>. Ábrelo
          para elegir tu contraseña.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-muted-foreground">
        Ahora entras con Google. Si quieres entrar también con tu email y una contraseña, te
        enviamos un enlace para crearla.
      </p>
      {requestEmail.error && <FormError>{requestEmail.error.message}</FormError>}
      <Button
        type="button"
        variant="outline"
        disabled={requestEmail.isPending}
        onClick={() => requestEmail.mutate(email)}
        className="h-10 rounded-full px-5"
      >
        {requestEmail.isPending && <Loader2 className="animate-spin" />}
        Enviarme el enlace
      </Button>
    </div>
  );
}
