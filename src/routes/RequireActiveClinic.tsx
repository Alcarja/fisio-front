import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { useMe, useSetActiveClinic } from "@/adapters/hook";
import { isSelectableClinic } from "@/lib/roles";
import { paths } from "./paths";

// Makes sure clinic users work on a chosen clinic. Use inside <RequireRole>.
// - Superadmins pass: without a clinic they're on the platform.
// - Active clinic set: pass.
// - Exactly one usable clinic: it's selected automatically.
// - Otherwise: the picker at /select-clinic.
export default function RequireActiveClinic({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data: me } = useMe();
  const setActive = useSetActiveClinic();

  const isSuperadmin = me?.user.role === "superadmin";
  const usable = me?.memberships.filter((m) => isSelectableClinic(m.clinicStatus)) ?? [];
  const autoSelectId =
    me && !isSuperadmin && !me.activeClinic && usable.length === 1
      ? usable[0]!.clinicId
      : null;

  useEffect(() => {
    if (autoSelectId && setActive.isIdle) setActive.mutate(autoSelectId);
  }, [autoSelectId, setActive]);

  if (!me || isSuperadmin || me.activeClinic) return <>{children}</>;

  if (autoSelectId && !setActive.isError) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <Navigate to={paths.selectClinic} replace state={{ from: location }} />;
}
