import { Building2, KeyRound, Loader2, MonitorSmartphone, UserRound } from "lucide-react";
import { useMe } from "@/adapters/hook";
import { clinicRoleLabels } from "@/lib/roles";
import AccountSection from "./components/AccountSection";
import ClinicsList from "./components/ClinicsList";
import PasswordForm from "./components/PasswordForm";
import ProfileForm from "./components/ProfileForm";
import SessionsCard from "./components/SessionsCard";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

// Every role: the logged-in user's own details, password and sessions.
// Everything is saved through Better Auth, which only acts on the session's user
export default function AccountPage() {
  const { data: me } = useMe();

  // The panel guards already loaded /me; this is only a fallback
  if (!me) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { user, activeClinic } = me;
  const roleText =
    user.role === "superadmin"
      ? "Superadmin"
      : activeClinic
        ? `${clinicRoleLabels[activeClinic.role]} en ${activeClinic.clinicName}`
        : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-coral">Tu cuenta</span>
        <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">
          Mi cuenta
        </h1>
        <p className="text-muted-foreground">Tus datos personales y cómo entras en Kineflow.</p>
      </header>

      {/* Who you are: what everyone else in the clinic sees */}
      <div className="flex items-center gap-4 rounded-[1.75rem] bg-secondary/60 p-5 sm:p-6">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-medium text-primary-foreground sm:size-16">
          {user.image ? (
            <img src={user.image} alt="" className="size-full object-cover" />
          ) : (
            initials(user.name)
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-display text-2xl leading-tight sm:text-3xl">
            {user.name}
          </span>
          <span className="truncate text-sm text-muted-foreground">{user.email}</span>
          {roleText && <span className="truncate text-xs text-coral">{roleText}</span>}
        </div>
      </div>

      <AccountSection
        icon={UserRound}
        title="Datos personales"
        description="Cómo te ven los demás en la clínica."
      >
        {/* key: start from the saved name again if it changes elsewhere */}
        <ProfileForm key={user.name} user={user} />
      </AccountSection>

      <AccountSection
        icon={KeyRound}
        title="Contraseña"
        description="Para entrar con tu email."
      >
        <PasswordForm user={user} />
      </AccountSection>

      <AccountSection
        icon={Building2}
        title="Tus clínicas"
        description="Dónde trabajas y con qué rol. Lo cambian los responsables de cada clínica."
      >
        <ClinicsList me={me} />
      </AccountSection>

      <AccountSection
        icon={MonitorSmartphone}
        title="Sesiones"
        description="Los dispositivos donde has entrado."
      >
        <SessionsCard />
      </AccountSection>
    </div>
  );
}
