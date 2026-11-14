import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import { paths } from "@/routes/paths";

// Top bar of the admin area: no website links, just where you are and your account.
// Sections are in the sidebar
export default function AdminNavbar() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-3">
      <nav className="flex items-center justify-between gap-3 rounded-full border bg-background/75 py-2 pr-2 pl-4 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link to={paths.admin} aria-label="Panel de Fisio">
            <Logo />
          </Link>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            Panel
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Link
            to={paths.home}
            className="hidden items-center gap-1 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            Ver la web <ArrowUpRight className="size-3.5" />
          </Link>
          <UserMenu area="admin" />
        </div>
      </nav>
    </header>
  );
}
