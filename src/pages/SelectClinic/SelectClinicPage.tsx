import { Link, useLocation, useNavigate, type Location } from "react-router";
import { ArrowRight, Building2, Check, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useMe, useSetActiveClinic } from "@/adapters/hook";
import ClinicAvatar from "@/components/ClinicAvatar";
import Logo from "@/components/Logo";
import { clinicRoleLabels, isSelectableClinic } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";

// Logged-in users pick which clinic to work on. Protected by <RequireRole>
export default function SelectClinicPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: me } = useMe();
  const setActive = useSetActiveClinic();

  // Where they were going before being sent here
  const from = (location.state as { from?: Location } | null)?.from;
  const redirectTo = from ? from.pathname + from.search + from.hash : paths.admin;

  if (!me) return null;

  const isSuperadmin = me.user.role === "superadmin";

  const choose = (clinicId: string, clinicName: string) => {
    // Already active: nothing to change
    if (clinicId === me.activeClinic?.clinicId) {
      navigate(redirectTo, { replace: true });
      return;
    }
    setActive.mutate(clinicId, {
      onSuccess: () => {
        toast.success(`Ahora estás en ${clinicName}`);
        navigate(redirectTo, { replace: true });
      },
      onError: (error) =>
        toast.error("No se pudo seleccionar la clínica", { description: error.message }),
    });
  };

  return (
    <div className="flex min-h-svh flex-col px-5 py-6 sm:px-10">
      <Link to={paths.home} aria-label="Inicio de Fisio" className="w-fit">
        <Logo />
      </Link>

      <div className="flex flex-1 items-center justify-center py-12">
        <div className="flex w-full max-w-md flex-col gap-8 motion-safe:animate-rise">
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-coral">Hola, {me.user.name}</span>
            <h1 className="font-display text-5xl leading-none tracking-tight">
              ¿En qué <em className="text-coral">clínica</em> trabajas hoy?
            </h1>
            <p className="text-muted-foreground">
              Puedes cambiar de clínica en cualquier momento desde el menú lateral.
            </p>
          </div>

          {me.memberships.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              <Building2 className="size-5" />
              Todavía no perteneces a ninguna clínica. Cuando te inviten, aparecerá aquí.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {me.memberships.map((m) => {
                const isActive = m.clinicId === me.activeClinic?.clinicId;
                const selectable = isSelectableClinic(m.clinicStatus);
                const isChoosing =
                  setActive.isPending && setActive.variables === m.clinicId;

                return (
                  <li key={m.clinicId}>
                    <button
                      type="button"
                      disabled={!selectable || setActive.isPending}
                      onClick={() => choose(m.clinicId, m.clinicName)}
                      className={cn(
                        "group flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left transition-colors",
                        "hover:border-primary/40 hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                        "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:bg-card",
                        isActive && "border-primary",
                      )}
                    >
                      <ClinicAvatar clinicId={m.clinicId} name={m.clinicName} size="lg" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{m.clinicName}</span>
                        <span className="truncate text-sm text-muted-foreground">
                          {selectable ? clinicRoleLabels[m.role] : "Clínica inactiva"}
                          {isActive && " · Activa ahora"}
                        </span>
                      </span>
                      {isChoosing ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      ) : isActive ? (
                        <Check className="size-4 text-primary" />
                      ) : (
                        selectable && (
                          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        )
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Superadmins can also work without a clinic */}
          {isSuperadmin && (
            <Link
              to={paths.admin}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ShieldCheck className="size-4" /> Ir a la plataforma
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
