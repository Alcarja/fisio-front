import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, type Location } from "react-router";
import { ArrowLeft, Check, CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { useSignIn } from "@/adapters/hook";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paths } from "@/routes/paths";

// Sample appointments for the decorative panel
const today = [
  { time: "09:15", patient: "Jorge Pérez", type: "Fisioterapia", color: "bg-sage" },
  { time: "10:30", patient: "Lucía Fernández", type: "Sesión 6 de 10", color: "bg-sky" },
  { time: "12:00", patient: "Elena Ruiz", type: "Masaje", color: "bg-sand" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useSignIn();

  // Set by <RequireRole> or the accept-invitation page when they send the user here
  const state = location.state as { from?: Location; email?: string } | null;
  const from = state?.from;
  const redirectTo = from ? from.pathname + from.search + from.hash : paths.admin;

  const [email, setEmail] = useState(state?.email ?? "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    signIn.mutate(
      { email, password, rememberMe },
      { onSuccess: () => navigate(redirectTo, { replace: true }) },
    );
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Form */}
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to={paths.home} aria-label="Inicio de Kineflow">
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
            <h1 className="font-display text-5xl leading-none tracking-tight">
              Hola de <em className="text-coral">nuevo</em>.
            </h1>
            <p className="mt-3 text-muted-foreground">
              Inicia sesión para gestionar tu clínica.
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl bg-card px-4"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
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
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="remember" className="font-normal text-muted-foreground">
                  Mantener la sesión iniciada
                </Label>
              </div>

              {signIn.error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  {signIn.error.message}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={signIn.isPending}
                className="mt-2 h-12 rounded-full text-base"
              >
                {signIn.isPending ? (
                  <>
                    <Loader2 className="animate-spin" /> Entrando…
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Brand panel */}
      <aside className="relative isolate hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:m-3 lg:flex lg:flex-col lg:justify-between lg:rounded-[2rem]">
        <svg
          viewBox="0 0 400 400"
          className="absolute -right-32 -bottom-32 -z-10 size-[36rem]"
          aria-hidden
        >
          {[60, 100, 140, 180].map((r) => (
            <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" />
          ))}
          <circle cx="200" cy="200" r="10" className="fill-coral" />
        </svg>

        <span className="text-sm text-primary-foreground/70">Martes, 12 de marzo</span>

        <div className="flex flex-col gap-10">
          <h2 className="max-w-md font-display text-6xl leading-[1.02] tracking-tight">
            Tu agenda de hoy te está <em className="text-coral">esperando</em>.
          </h2>

          <div className="flex max-w-sm flex-col gap-2" aria-hidden>
            {today.map((a, i) => (
              <div
                key={a.time}
                className="flex items-center gap-3 rounded-2xl bg-primary-foreground/95 p-3 text-foreground shadow-lg motion-safe:animate-rise"
                style={{ animationDelay: `${200 + i * 120}ms` }}
              >
                <span className={`h-9 w-1.5 rounded-full ${a.color}`} />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{a.patient}</span>
                  <span className="text-xs text-muted-foreground">{a.type}</span>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{a.time}</span>
              </div>
            ))}
            <div
              className="mt-2 flex items-center gap-2 text-sm text-primary-foreground/80 motion-safe:animate-rise"
              style={{ animationDelay: "600ms" }}
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-coral">
                <Check className="size-3 text-white" />
              </span>
              Todos los pacientes han confirmado
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
