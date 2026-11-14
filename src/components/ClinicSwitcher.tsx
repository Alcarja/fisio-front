import { Link, useNavigate } from "react-router";
import { Check, ChevronsUpDown, LayoutGrid, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useMe, useSetActiveClinic } from "@/adapters/hook";
import ClinicAvatar from "@/components/ClinicAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clinicRoleLabels, isSelectableClinic } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";

// Shows which clinic the user is working on and lets them switch.
// Superadmins without an active clinic are on the "Plataforma"
export default function ClinicSwitcher({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const setActive = useSetActiveClinic();

  if (!me) return null;

  const active = me.activeClinic;
  const memberships = me.memberships;
  const isSuperadmin = me.user.role === "superadmin";

  // null = back to the platform (superadmins only)
  const switchTo = (clinicId: string | null, label: string) => {
    if (clinicId === (active?.clinicId ?? null)) return;
    setActive.mutate(clinicId, {
      onSuccess: () => {
        toast.success(clinicId ? `Ahora estás en ${label}` : "Has vuelto a la plataforma");
        // Pages belong to the previous clinic: start from the overview
        navigate(paths.admin);
      },
      onError: (error) =>
        toast.error("No se pudo cambiar de clínica", { description: error.message }),
    });
  };

  const current = (
    <>
      <span className="relative">
        {active ? (
          <ClinicAvatar clinicId={active.clinicId} name={active.clinicName} />
        ) : (
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </span>
        )}
        {setActive.isPending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70">
            <Loader2 className="size-4 animate-spin" />
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
        <span className="truncate text-sm font-medium">
          {active ? active.clinicName : isSuperadmin ? "Plataforma" : "Sin clínica"}
        </span>
        <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          {active && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
          {active
            ? clinicRoleLabels[active.role]
            : isSuperadmin
              ? "Todas las clínicas"
              : "Elige una clínica"}
        </span>
      </span>
    </>
  );

  const box = "flex w-full items-center gap-3 rounded-2xl border bg-background p-2 pr-3";
  const canSwitch =
    memberships.length > 1 || (memberships.length === 1 && !active) || (isSuperadmin && !!active);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="px-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {active ? "Trabajando en" : "Estás en"}
      </span>

      {!canSwitch ? (
        <div className={box}>{current}</div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={setActive.isPending}
            aria-label="Cambiar de clínica"
            className={cn(
              box,
              "group transition-colors outline-none hover:border-primary/30 hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:border-primary/40 data-[state=open]:bg-muted/60",
            )}
          >
            {current}
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-xl p-1.5"
          >
            <DropdownMenuLabel className="px-2 pt-1 pb-2 text-xs font-normal text-muted-foreground">
              Cambiar de clínica
            </DropdownMenuLabel>

            {memberships.map((m) => {
              const isActive = m.clinicId === active?.clinicId;
              const selectable = isSelectableClinic(m.clinicStatus);
              return (
                <DropdownMenuItem
                  key={m.clinicId}
                  disabled={!selectable}
                  onSelect={() => switchTo(m.clinicId, m.clinicName)}
                  className={cn("gap-3 rounded-lg px-2 py-1.5", isActive && "bg-secondary")}
                >
                  <ClinicAvatar clinicId={m.clinicId} name={m.clinicName} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-sm font-medium">{m.clinicName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {selectable ? clinicRoleLabels[m.role] : "Inactiva"}
                    </span>
                  </span>
                  {isActive && <Check className="size-4 text-primary" />}
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator className="my-1.5" />

            {/* Superadmins can leave the clinic and go back to managing the platform */}
            {isSuperadmin && active && (
              <DropdownMenuItem
                onSelect={() => switchTo(null, "Plataforma")}
                className="gap-3 rounded-lg px-2 py-1.5"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-muted">
                  <ShieldCheck className="size-3.5" />
                </span>
                <span className="text-sm">Volver a la plataforma</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem asChild className="gap-3 rounded-lg px-2 py-1.5">
              <Link to={paths.selectClinic}>
                <span className="flex size-7 items-center justify-center rounded-lg bg-muted">
                  <LayoutGrid className="size-3.5" />
                </span>
                <span className="text-sm">Ver todas las clínicas</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
