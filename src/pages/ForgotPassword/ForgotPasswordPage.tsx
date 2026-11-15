import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router";
import { ArrowLeft, CircleAlert, Loader2, MailCheck } from "lucide-react";
import { useRequestPasswordEmail } from "@/adapters/hook";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paths } from "@/routes/paths";

// Seconds before the link can be sent again (Better Auth also rate limits)
const RESEND_AFTER = 60;

// Public page: asks for the email and sends a link to choose a new password.
// The link goes to /reset-password (ResetPasswordPage), which sets it.
// The answer is the same whether the email has an account or not, so the page
// never says "this email doesn't exist"
export default function ForgotPasswordPage() {
  const location = useLocation();
  // The login page passes along whatever the user had typed
  const typedEmail = (location.state as { email?: string } | null)?.email ?? "";

  const requestEmail = useRequestPasswordEmail();
  const [email, setEmail] = useState(typedEmail);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  // Countdown for "send again"
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const send = (address: string) =>
    requestEmail.mutate(address, {
      onSuccess: () => {
        setSentTo(address);
        setWait(RESEND_AFTER);
      },
    });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(email.trim());
  };

  const error = requestEmail.error && (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {requestEmail.error.message}
    </div>
  );

  return (
    <div className="flex min-h-svh flex-col px-5 py-6 sm:px-10">
      <div className="flex items-center justify-between">
        <Link to={paths.home} aria-label="Inicio de Kineflow">
          <Logo />
        </Link>
        <Link
          to={paths.login}
          state={{ email: sentTo ?? email }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver a iniciar sesión
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-sm motion-safe:animate-rise">
          {sentTo ? (
            <div className="flex flex-col items-start gap-4" aria-live="polite">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                <MailCheck className="size-5 text-primary" />
              </span>
              <h1 className="font-display text-5xl leading-none tracking-tight">
                Revisa tu <em className="text-coral">correo</em>.
              </h1>
              <p className="text-muted-foreground">
                Si <span className="font-medium text-foreground">{sentTo}</span> tiene una cuenta
                en Kineflow, te llegará un enlace para elegir una contraseña nueva. Caduca en una
                hora.
              </p>
              <p className="text-sm text-muted-foreground">
                ¿No lo ves? Mira en la carpeta de spam o promociones.
              </p>

              {error}

              <div className="mt-2 flex w-full flex-col gap-3">
                <Button asChild size="lg" className="h-12 rounded-full text-base">
                  <Link to={paths.login} state={{ email: sentTo }}>
                    Ir a iniciar sesión
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={wait > 0 || requestEmail.isPending}
                  onClick={() => send(sentTo)}
                  className="h-12 rounded-full text-base"
                >
                  {requestEmail.isPending && <Loader2 className="animate-spin" />}
                  {wait > 0 ? `Reenviar en ${wait} s` : "Reenviar el enlace"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setSentTo(null);
                    requestEmail.reset();
                  }}
                  className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Usar otro correo
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-display text-5xl leading-none tracking-tight">
                ¿Has olvidado tu <em className="text-coral">contraseña</em>?
              </h1>
              <p className="mt-3 text-muted-foreground">
                Escribe tu correo y te enviaremos un enlace para elegir una nueva.
              </p>

              <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@clinica.com"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl bg-card px-4 text-base md:text-sm"
                  />
                </div>

                {error}

                <Button
                  type="submit"
                  size="lg"
                  disabled={requestEmail.isPending}
                  className="mt-2 h-12 rounded-full text-base"
                >
                  {requestEmail.isPending ? (
                    <>
                      <Loader2 className="animate-spin" /> Enviando…
                    </>
                  ) : (
                    "Enviar enlace"
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
