import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, CircleAlert, Loader2, MailX } from "lucide-react";
import { toast } from "sonner";
import type { ClinicRole, PublicInvitation } from "@/adapters/api";
import {
  useAcceptInvitation,
  useInvitation,
  useMe,
  useSignOut,
  useSignUp,
} from "@/adapters/hook";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paths } from "@/routes/paths";

const roleNames: Record<ClinicRole, string> = {
  owner: "propietario",
  admin: "administrador",
  receptionist: "recepción",
  physio: "fisioterapeuta",
};

// Same minimum as the backend (Better Auth emailAndPassword.minPasswordLength)
const MIN_PASSWORD_LENGTH = 10;

// Public page opened from the invitation email. Depending on who is visiting:
// sign up, log in, switch account, or accept
export default function AcceptInvitationPage() {
  const { invitationId } = useParams<{ invitationId: string }>();
  const invitation = useInvitation(invitationId);
  const me = useMe();

  let content: ReactNode;

  if (invitation.isPending || me.isPending) {
    content = (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  } else if (invitation.error) {
    content = (
      <Problem
        title="Invitación no válida"
        message="El enlace no es correcto o la invitación ya no existe."
      />
    );
  } else if (invitation.data.status !== "pending") {
    content = <NotPending invitation={invitation.data} />;
  } else if (invitation.data.expired) {
    content = (
      <Problem
        title="La invitación ha caducado"
        message="Pide a quien te invitó que te la reenvíe."
      />
    );
  } else if (me.error || !me.data) {
    // Not logged in
    content = invitation.data.hasAccount ? (
      <LogInStep invitation={invitation.data} />
    ) : (
      <SignUpStep invitation={invitation.data} />
    );
  } else if (me.data.user.email.toLowerCase() !== invitation.data.email.toLowerCase()) {
    content = <WrongAccount invitation={invitation.data} currentEmail={me.data.user.email} />;
  } else {
    content = <AcceptStep invitation={invitation.data} />;
  }

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
        <div className="w-full max-w-sm motion-safe:animate-rise">{content}</div>
      </div>
    </div>
  );
}

// "Te han invitado a Clínica Sol como propietario"
function Heading({ invitation }: { invitation: PublicInvitation }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-coral">Invitación</span>
      <h1 className="font-display text-5xl leading-none tracking-tight">
        Únete a <em className="text-coral">{invitation.clinicName}</em>.
      </h1>
      <p className="text-muted-foreground">
        Te han invitado
        {invitation.role && <> como {roleNames[invitation.role]}</>}. La invitación es
        para <strong className="font-medium text-foreground">{invitation.email}</strong>.
      </p>
    </div>
  );
}

function SignUpStep({ invitation }: { invitation: PublicInvitation }) {
  const signUp = useSignUp();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // On success the user is logged in and the page moves to the accept step
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    signUp.mutate({ name: name.trim(), email: invitation.email, password });
  };

  return (
    <div className="flex flex-col gap-8">
      <Heading invitation={invitation} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <p className="text-sm text-muted-foreground">Crea tu cuenta para continuar.</p>

        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-email">Correo electrónico</Label>
          <Input
            id="signup-email"
            type="email"
            value={invitation.email}
            readOnly
            disabled
            className="h-11 rounded-xl px-4"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-name">Nombre</Label>
          <Input
            id="signup-name"
            required
            autoFocus
            autoComplete="name"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-xl bg-card px-4"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-password">Contraseña</Label>
          <Input
            id="signup-password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl bg-card px-4"
          />
          <p className="text-xs text-muted-foreground">
            Mínimo {MIN_PASSWORD_LENGTH} caracteres.
          </p>
        </div>

        {signUp.error && <ErrorBox message={signUp.error.message} />}

        <Button
          type="submit"
          size="lg"
          disabled={signUp.isPending}
          className="mt-2 h-12 rounded-full text-base"
        >
          {signUp.isPending ? (
            <>
              <Loader2 className="animate-spin" /> Creando cuenta…
            </>
          ) : (
            "Crear cuenta"
          )}
        </Button>
      </form>
    </div>
  );
}

function LogInStep({ invitation }: { invitation: PublicInvitation }) {
  const location = useLocation();

  return (
    <div className="flex flex-col gap-8">
      <Heading invitation={invitation} />
      <p className="text-sm text-muted-foreground">
        Ya tienes una cuenta con este email. Inicia sesión para aceptar la invitación.
      </p>
      {/* The login page sends the user back here afterwards (state.from) */}
      <Button asChild size="lg" className="h-12 rounded-full text-base">
        <Link to={paths.login} state={{ from: location, email: invitation.email }}>
          Iniciar sesión
        </Link>
      </Button>
    </div>
  );
}

function WrongAccount({
  invitation,
  currentEmail,
}: {
  invitation: PublicInvitation;
  currentEmail: string;
}) {
  const signOut = useSignOut();

  return (
    <div className="flex flex-col gap-8">
      <Heading invitation={invitation} />
      <div className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
        <span>
          Has iniciado sesión como{" "}
          <strong className="font-medium">{currentEmail}</strong>.
        </span>
        <span className="text-muted-foreground">
          Cierra sesión para continuar con {invitation.email}.
        </span>
      </div>
      {signOut.error && <ErrorBox message={signOut.error.message} />}
      <Button
        size="lg"
        variant="outline"
        className="h-12 rounded-full text-base"
        disabled={signOut.isPending}
        onClick={() => signOut.mutate()}
      >
        {signOut.isPending ? <Loader2 className="animate-spin" /> : "Cerrar sesión"}
      </Button>
    </div>
  );
}

function AcceptStep({ invitation }: { invitation: PublicInvitation }) {
  const navigate = useNavigate();
  const accept = useAcceptInvitation();

  const handleAccept = () =>
    accept.mutate(invitation.id, {
      // The hook waits for the user to reload, so the admin guard sees the new role
      onSuccess: () => {
        toast.success(`Te has unido a ${invitation.clinicName}`);
        navigate(paths.admin, { replace: true });
      },
    });

  return (
    <div className="flex flex-col gap-8">
      <Heading invitation={invitation} />
      {accept.error && <ErrorBox message={accept.error.message} />}
      <Button
        size="lg"
        className="h-12 rounded-full text-base"
        disabled={accept.isPending}
        onClick={handleAccept}
      >
        {accept.isPending ? (
          <>
            <Loader2 className="animate-spin" /> Aceptando…
          </>
        ) : (
          "Aceptar invitación"
        )}
      </Button>
    </div>
  );
}

function NotPending({ invitation }: { invitation: PublicInvitation }) {
  if (invitation.status === "accepted") {
    return (
      <Problem
        title="Invitación ya aceptada"
        message={`Ya formas parte de ${invitation.clinicName}.`}
        action={
          <Button asChild size="lg" className="h-12 rounded-full text-base">
            <Link to={paths.admin}>Ir a la administración</Link>
          </Button>
        }
      />
    );
  }
  return (
    <Problem
      title="Invitación no disponible"
      message={
        invitation.status === "canceled"
          ? "Esta invitación se ha cancelado."
          : "Esta invitación se ha rechazado."
      }
    />
  );
}

function Problem({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
        <MailX className="size-5 text-primary" />
      </span>
      <h1 className="font-display text-4xl leading-none tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{message}</p>
      {action && <div className="mt-2 w-full">{action}</div>}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {message}
    </div>
  );
}
