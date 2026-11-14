import { Link, NavLink } from "react-router";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useMe } from "@/adapters/hook";
import ClinicSwitcher from "@/components/ClinicSwitcher";
import { paths } from "@/routes/paths";
import {
  bookingsAccess,
  hasAccess,
  superadminAccess,
  teamAccess,
  type AccessRule,
} from "@/lib/roles";
import { cn } from "@/lib/utils";

// One link in the menu
type SidebarItem = {
  label: string;
  icon: LucideIcon; // any icon from lucide-react
  // URL it opens (from paths.ts). Leave it out while the page doesn't exist:
  // the item shows greyed out with a "Pronto" tag
  to?: string;
};

// A group of links with a small title above
type SidebarSection = {
  title: string;
  items: SidebarItem[];
  // Who sees the section. Leave it out to show it to everyone in the panel.
  // Hiding a section is cosmetic: also protect its routes in router.tsx
  access?: AccessRule;
};

// The whole menu, top to bottom. The same list is used for the desktop sidebar
// and the row of pills on phones.
//
// Everyone enters the panel; each role only sees the sections its rule allows
// (rules in lib/roles.ts, the same ones the routes use in router.tsx).
//
// To add a page: 1) add its URL to paths.ts, 2) add its route in router.tsx,
// 3) add an item here with `to: paths.yourPage`
const sections: SidebarSection[] = [
  // Everyone
  {
    title: "General",
    items: [{ label: "Resumen", icon: LayoutDashboard, to: paths.admin }],
  },
  // Everyone who works in the active clinic
  {
    title: "Agenda",
    access: bookingsAccess,
    items: [{ label: "Reservas", icon: CalendarDays, to: paths.adminBookings }],
  },
  // Superadmins: all clinics, creating clinics
  {
    title: "Plataforma",
    access: superadminAccess,
    items: [{ label: "Clínicas", icon: Building2, to: paths.adminClinics }],
  },
  // Owners and admins of the active clinic: staff and settings
  {
    title: "Clínica",
    access: teamAccess,
    items: [
      { label: "Equipo", icon: Users, to: paths.adminTeam },
      { label: "Configuración", icon: Settings, to: paths.adminSettings },
    ],
  },
  // Physios and receptionists (access: staffAccess): add their section here
  // when its pages exist
];

function ItemLink({ item, compact = false }: { item: SidebarItem; compact?: boolean }) {
  const Icon = item.icon;
  const base = cn(
    "flex items-center gap-3 rounded-full text-sm transition-colors",
    compact ? "shrink-0 px-4 py-2" : "px-3 py-2",
  );

  if (!item.to) {
    return (
      <span className={cn(base, "cursor-default text-muted-foreground/60")} aria-disabled>
        <Icon className="size-4" />
        {item.label}
        {!compact && (
          <span className="ml-auto rounded-full border px-2 py-0.5 text-[10px]">Pronto</span>
        )}
      </span>
    );
  }

  return (
    <NavLink
      to={item.to}
      // Exact match only for /admin, so other items stay active on their subpages
      // (e.g. "Clínicas" while viewing a clinic)
      end={item.to === paths.admin}
      className={({ isActive }) =>
        cn(
          base,
          isActive
            ? "bg-secondary font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn("size-4", isActive && "text-primary")} />
          {item.label}
          {isActive && !compact && <span className="ml-auto size-1.5 rounded-full bg-coral" />}
        </>
      )}
    </NavLink>
  );
}

export default function AdminSidebar() {
  const { data: me } = useMe();
  const visibleSections = sections.filter((s) => !s.access || hasAccess(me, s.access));
  const items = visibleSections.flatMap((s) => s.items);

  return (
    <>
      {/* Phones: active clinic, then a scrollable row of pills */}
      <div className="flex flex-col gap-3 md:hidden">
        <ClinicSwitcher />
        <nav
          aria-label="Panel"
          className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
        >
          {items.map((item) => (
            <ItemLink key={item.label} item={item} compact />
          ))}
        </nav>
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden md:block">
        <div className="sticky top-24 flex max-h-[calc(100svh-7rem)] flex-col gap-6 rounded-[1.75rem] border bg-card p-4">
          {/* Always visible: which clinic everything below refers to */}
          <ClinicSwitcher />

          <nav aria-label="Panel" className="flex flex-1 flex-col gap-6 overflow-y-auto">
            {visibleSections.map((section) => (
              <div key={section.title} className="flex flex-col gap-1">
                <span className="px-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {section.title}
                </span>
                {section.items.map((item) => (
                  <ItemLink key={item.label} item={item} />
                ))}
              </div>
            ))}
          </nav>

          <Link
            to={paths.home}
            className="flex items-center gap-2 border-t px-3 pt-4 pb-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Volver a la web
          </Link>
        </div>
      </aside>
    </>
  );
}
