import { useState } from "react";
import { Link, NavLink } from "react-router";
import { ArrowRight, LayoutDashboard, Menu, X } from "lucide-react";
import { useMe } from "@/adapters/hook";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { panelAccess, couldHaveAccess } from "@/lib/roles";
import { paths } from "@/routes/paths";
import { cn } from "@/lib/utils";

// Website links only. The admin area has its own top bar (AdminNavbar)
const links = [
  { to: paths.home, label: "Producto" },
  { to: paths.about, label: "Sobre nosotros" },
];

// Top bar of the public website
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: me } = useMe();
  // Offer the panel if any of their clinics allows it (they can switch there)
  const canOpenPanel = couldHaveAccess(me, panelAccess);

  return (
    <header className="sticky top-0 z-50 px-4 pt-3">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border bg-background/75 py-2 pr-2 pl-4 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)] backdrop-blur-xl">
        <Link to={paths.home} aria-label="Inicio de Kineflow" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === paths.home}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-4 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {me ? (
            // Logged in: go to the panel, account menu (with log out)
            <>
              {canOpenPanel && (
                <Button className="hidden rounded-full sm:inline-flex" asChild>
                  <Link to={paths.admin}>
                    <LayoutDashboard /> Panel
                  </Link>
                </Button>
              )}
              <UserMenu area="public" />
            </>
          ) : (
            <>
              <Button variant="ghost" className="hidden rounded-full sm:inline-flex" asChild>
                <Link to={paths.login}>Iniciar sesión</Link>
              </Button>
              <Button className="hidden rounded-full sm:inline-flex">
                Empieza gratis <ArrowRight />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl rounded-3xl border bg-background/95 p-2 shadow-lg backdrop-blur-xl motion-safe:animate-rise md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === paths.home}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "block rounded-2xl px-4 py-3",
                  isActive ? "bg-secondary font-medium" : "text-muted-foreground",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          {me ? (
            canOpenPanel && (
              <Button className="mt-2 w-full rounded-2xl" size="lg" asChild>
                <Link to={paths.admin} onClick={() => setOpen(false)}>
                  <LayoutDashboard /> Ir al panel
                </Link>
              </Button>
            )
          ) : (
            <>
              <Button variant="outline" className="mt-2 w-full rounded-2xl" size="lg" asChild>
                <Link to={paths.login} onClick={() => setOpen(false)}>
                  Iniciar sesión
                </Link>
              </Button>
              <Button className="mt-2 w-full rounded-2xl" size="lg">
                Empieza gratis <ArrowRight />
              </Button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
