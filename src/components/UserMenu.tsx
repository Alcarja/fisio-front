import { Link, useNavigate } from "react-router";
import { Globe, LayoutDashboard, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useMe, useSignOut } from "@/adapters/hook";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { panelAccess, clinicRoleLabels, couldHaveAccess } from "@/lib/roles";
import { paths } from "@/routes/paths";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

type Props = {
  // Where the menu is shown: offers a link to the other area
  area: "public" | "admin";
};

// Avatar button with the user's details, a link to the other area and log out.
// Renders nothing when logged out
export default function UserMenu({ area }: Props) {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const signOut = useSignOut();

  if (!me) return null;

  const { user, activeClinic } = me;
  const roleText =
    user.role === "superadmin"
      ? "Superadmin"
      : activeClinic
        ? `${clinicRoleLabels[activeClinic.role]} · ${activeClinic.clinicName}`
        : null;

  const logOut = () =>
    signOut.mutate(undefined, {
      onSuccess: () => {
        toast.success("Has cerrado sesión");
        navigate(paths.login, { replace: true });
      },
      onError: (error) =>
        toast.error("No se pudo cerrar sesión", { description: error.message }),
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Tu cuenta"
        className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-medium text-primary-foreground outline-none transition-shadow hover:ring-3 hover:ring-primary/20 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {user.image ? (
          <img src={user.image} alt="" className="size-full object-cover" />
        ) : (
          initials(user.name)
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl p-1.5">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5 font-normal">
          <span className="truncate text-sm font-medium">{user.name}</span>
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          {roleText && (
            <span className="mt-1 truncate text-xs text-coral">{roleText}</span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1.5" />

        {area === "public" && couldHaveAccess(me, panelAccess) && (
          <DropdownMenuItem asChild className="gap-2 rounded-lg">
            <Link to={paths.admin}>
              <LayoutDashboard /> Ir al panel
            </Link>
          </DropdownMenuItem>
        )}
        {area === "admin" && (
          <DropdownMenuItem asChild className="gap-2 rounded-lg">
            <Link to={paths.home}>
              <Globe /> Ver la web
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="my-1.5" />

        <DropdownMenuItem
          variant="destructive"
          disabled={signOut.isPending}
          // Keep the menu open while logging out so the spinner is visible
          onSelect={(event) => {
            event.preventDefault();
            logOut();
          }}
          className="gap-2 rounded-lg"
        >
          {signOut.isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
