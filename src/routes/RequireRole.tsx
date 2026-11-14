import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { useMe } from "@/adapters/hook";
import { hasAccess, type AccessRule } from "@/lib/roles";
import { paths } from "./paths";

type Props = {
  // Leave out to only require being logged in
  access?: AccessRule;
  // Where to send logged-in users who lack access
  redirectTo?: string;
  children: ReactNode;
};

export default function RequireRole({
  access,
  redirectTo = paths.home,
  children,
}: Props) {
  const location = useLocation();
  const { data: me, isPending, isError, isFetching } = useMe();

  // Also wait while an errored query is retrying (e.g. right after signing in)
  if (isPending || (isError && isFetching)) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Checks if you are logged in
  if (isError || !me) {
    return <Navigate to={paths.login} replace state={{ from: location }} />;
  }

  if (access && !hasAccess(me, access)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
