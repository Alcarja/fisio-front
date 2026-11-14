import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, CircleAlert, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useResetPassword } from "@/adapters/hook";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paths } from "@/routes/paths";

// Same minimum as the backend (Better Auth emailAndPassword.minPasswordLength)
const MIN_PASSWORD_LENGTH = 10;

// Public page. The email link goes to the backend, which checks the token and
// redirects here with ?token=… (or ?error=INVALID_TOKEN if it's wrong/expired).
// Used both by new members (first password) and by "forgot password".
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");

  const resetPassword = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    resetPassword.mutate(
      { newPassword: password, token: token! },
      {
        // Better Auth doesn't log the user in here: send them to the login page
        onSuccess: () => {
          toast.success("Contraseña guardada. Ya puedes iniciar sesión.");
          navigate(paths.login, { replace: true });
        },
      },
    );
  };

  const invalidLink = !!linkError || !token;

  return (
    <div className="flex min-h-svh flex-col px-5 py-6 sm:px-10">
      <div className="flex items-center justify-between">
        <Link to={paths.home} aria-label="Inicio de Fisio">
          <Logo />
        </Link>
        <Link
          to={paths.home}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver a la web
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-sm motion-safe:animate-rise">
          {invalidLink ? (
            <div className="flex flex-col items-start gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                <KeyRound className="size-5 text-primary" />
              </span>
              <h1 className="font-display text-4xl leading-none tracking-tight">
                Enlace no válido
              </h1>
              <p className="text-muted-foreground">
                El enlace no es correcto o ha caducado. Pide que te envíen uno nuevo.
              </p>
              <Button asChild size="lg" variant="outline" className="mt-2 h-12 w-full rounded-full text-base">
                <Link to={paths.login}>Ir a iniciar sesión</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-5xl leading-none tracking-tight">
                Elige tu <em className="text-coral">contraseña</em>.
              </h1>
              <p className="mt-3 text-muted-foreground">
                La usarás para entrar en tu clínica.
              </p>

              <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••••"
                      required
                      autoFocus
                      minLength={MIN_PASSWORD_LENGTH}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-xl bg-card pr-11 pl-4"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo {MIN_PASSWORD_LENGTH} caracteres.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirm-password">Repite la contraseña</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••••"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="h-11 rounded-xl bg-card px-4"
                  />
                </div>

                {(mismatch || resetPassword.error) && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    {mismatch ? "Las contraseñas no coinciden" : resetPassword.error?.message}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={resetPassword.isPending}
                  className="mt-2 h-12 rounded-full text-base"
                >
                  {resetPassword.isPending ? (
                    <>
                      <Loader2 className="animate-spin" /> Guardando…
                    </>
                  ) : (
                    "Guardar contraseña"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
