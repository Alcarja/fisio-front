import { NavLink, Outlet } from "react-router";
import { ClipboardList, Clock, DoorOpen, QrCode, type LucideIcon } from "lucide-react";
import type { ClinicFeature } from "@/adapters/api";
import { useMe } from "@/adapters/hook";
import { hasFeature } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";

// The settings sections, in the order they should be set up (CALENDARIO.md):
// the schedule first, then rooms, then services (services need room types)
// `feature`: only shown in clinics that have it switched on
const sections: { label: string; icon: LucideIcon; to: string; feature?: ClinicFeature }[] = [
  { label: "Horario", icon: Clock, to: paths.adminSettingsSchedule },
  { label: "Salas", icon: DoorOpen, to: paths.adminSettingsRooms },
  { label: "Servicios", icon: ClipboardList, to: paths.adminSettingsServices },
  {
    label: "Reserva online",
    icon: QrCode,
    to: paths.adminSettingsOnlineBooking,
    feature: "online_booking",
  },
];

// Owners and admins: header + tabs shared by every settings section.
// The chosen section is drawn in <Outlet />. Protected in the router (teamAccess)
export default function SettingsLayout() {
  const { data: me } = useMe();
  const visibleSections = sections.filter((s) => !s.feature || hasFeature(me, s.feature));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-coral">
          {me?.activeClinic?.clinicName ?? "Clínica"}
        </span>
        <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">
          Configuración
        </h1>
        <p className="text-muted-foreground">Ajusta cómo funciona tu clínica.</p>
      </header>

      {/* Tabs: scroll sideways on phones */}
      <nav
        aria-label="Secciones de configuración"
        className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0"
      >
        <div className="flex gap-1 rounded-full border bg-card p-1">
          {visibleSections.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("size-4", isActive && "text-primary")} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
