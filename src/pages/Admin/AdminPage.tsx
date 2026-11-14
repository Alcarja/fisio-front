import { Link } from "react-router";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChartColumn,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useMe } from "@/adapters/hook";
import {
  bookingsAccess,
  clinicRoleLabels,
  hasAccess,
  superadminAccess,
  teamAccess,
} from "@/lib/roles";
import { paths } from "@/routes/paths";

type Shortcut = {
  icon: LucideIcon;
  title: string;
  description: string;
  to?: string; // leave out while the page doesn't exist
};

// Panel home (/admin), for everyone. Shows what each role can do here,
// using the same rules as the sidebar sections
export default function AdminPage() {
  const { data: me } = useMe();
  if (!me) return null;

  const firstName = me.user.name.split(" ")[0];
  const subtitle =
    me.user.role === "superadmin"
      ? "Gestionas la plataforma Kineflow."
      : me.activeClinic
        ? `${clinicRoleLabels[me.activeClinic.role]} en ${me.activeClinic.clinicName}.`
        : "";

  const shortcuts: Shortcut[] = [];
  if (hasAccess(me, bookingsAccess)) {
    shortcuts.push({
      icon: CalendarDays,
      title: "Reservas",
      description: "El calendario de citas de tu clínica.",
      to: paths.adminBookings,
    });
  }
  if (hasAccess(me, superadminAccess)) {
    shortcuts.push({
      icon: Building2,
      title: "Clínicas",
      description: "Consulta todas las clínicas y da de alta nuevas.",
      to: paths.adminClinics,
    });
  }
  if (hasAccess(me, teamAccess)) {
    shortcuts.push({
      icon: Users,
      title: "Equipo",
      description: "Gestiona el personal de tu clínica y sus roles.",
      to: paths.adminTeam,
    });
    shortcuts.push({
      icon: ChartColumn,
      title: "Informes",
      description: "Las reservas del mes por servicio y por fisio.",
      to: paths.adminReports,
    });
    shortcuts.push({
      icon: Settings,
      title: "Configuración",
      description: "Horario, salas y servicios de tu clínica.",
      to: paths.adminSettings,
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-coral">Panel</span>
        <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">
          Hola, {firstName}
        </h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {shortcuts.map((s) => (
          <li key={s.title}>
            <ShortcutCard shortcut={s} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShortcutCard({ shortcut }: { shortcut: Shortcut }) {
  const Icon = shortcut.icon;
  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
        <Icon className="size-4 text-primary" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 font-medium">
          {shortcut.title}
          {!shortcut.to && (
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
              Pronto
            </span>
          )}
        </span>
        <span className="text-sm text-muted-foreground">{shortcut.description}</span>
      </span>
      {shortcut.to && (
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      )}
    </>
  );

  const card = "group flex h-full items-start gap-4 rounded-[1.5rem] border bg-card p-5";

  return shortcut.to ? (
    <Link
      to={shortcut.to}
      className={`${card} transition-colors hover:border-primary/30 hover:bg-muted/50`}
    >
      {body}
    </Link>
  ) : (
    <div className={`${card} border-dashed`}>{body}</div>
  );
}
