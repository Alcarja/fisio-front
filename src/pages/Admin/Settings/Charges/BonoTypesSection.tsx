import { useState } from "react";
import { CircleAlert, Loader2, MoreHorizontal, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";
import type { BonoKind, BonoType, BonoTypeInput } from "@/adapters/api";
import {
  useBonoTypes,
  useCalendarConfig,
  useCreateBonoType,
  useDeleteBonoType,
  useMe,
  useUpdateBonoType,
} from "@/adapters/hook";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { centsToInput, formatPrice, inputToCents } from "../../Charges/chargesUtils";
import SettingsSection from "../components/SettingsSection";

// "10 sesiones · caduca a los 6 meses" / "Mensual · 2 sesiones por semana"
export function describeBono(t: Pick<BonoType, "kind" | "sessions" | "validityDays" | "sessionsPerWeek">) {
  if (t.kind === "monthly") {
    return t.sessionsPerWeek
      ? `Mensual · ${t.sessionsPerWeek} ${t.sessionsPerWeek === 1 ? "sesión" : "sesiones"} por semana`
      : "Mensual · sin límite de sesiones";
  }
  const sessions = `${t.sessions} ${t.sessions === 1 ? "sesión" : "sesiones"}`;
  if (!t.validityDays) return `${sessions} · no caduca`;
  const months = t.validityDays % 30 === 0 ? t.validityDays / 30 : null;
  return `${sessions} · caduca a los ${months ? `${months} ${months === 1 ? "mes" : "meses"}` : `${t.validityDays} días`}`;
}

// Configuración → Cobros → Tipos de bono: what the clinic sells. Owners and
// admins. Changing a type never changes bonos already sold
export default function BonoTypesSection() {
  const { data: me } = useMe();
  const { data, isPending, error } = useBonoTypes(me?.activeClinic?.clinicId);
  const [editing, setEditing] = useState<BonoType | "new" | null>(null);
  const [deleting, setDeleting] = useState<BonoType | null>(null);
  const update = useUpdateBonoType();
  const remove = useDeleteBonoType();

  const toggle = (t: BonoType) =>
    update.mutate(
      { ...inputOf(t), isActive: !t.isActive, id: t.id },
      {
        onSuccess: () => toast.success(t.isActive ? "Bono desactivado: ya no se puede vender" : "Bono activado"),
        onError: (e) => toast.error("No se pudo cambiar", { description: e.message }),
      },
    );

  return (
    <SettingsSection
      title="Tipos de bono"
      description="Lo que vendes: bonos de X sesiones o mensuales, cada uno de un servicio. Cambiar un tipo no cambia los bonos ya vendidos."
      action={
        <Button size="sm" className="rounded-full" onClick={() => setEditing("new")}>
          <Plus /> Añadir
        </Button>
      }
    >
      {isPending ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error.message}
        </p>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
          <Ticket className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Todavía no hay bonos. Por ejemplo: «Bono 10 sesiones de fisioterapia» o «Pilates 2 días por semana».
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {data.map((t) => (
            <li key={t.id} className={cn("flex items-center gap-3 px-4 py-3", !t.isActive && "opacity-60")}>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 truncate font-medium">
                  {t.name}
                  {!t.isActive && (
                    <span className="rounded-full border px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
                      Desactivado
                    </span>
                  )}
                  {t.isActive && !t.sellable && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-normal text-destructive">
                      Servicio no disponible
                    </span>
                  )}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {t.serviceName} · {describeBono(t)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="tabular-nums">{formatPrice(t.priceCents)}</span>
                <Savings type={t} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label={`Acciones de ${t.name}`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditing(t)}>Editar</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => toggle(t)}>{t.isActive ? "Desactivar" : "Activar"}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(t)}>
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <BonoTypeDialog value={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar tipo de bono"
        description={`¿Eliminar «${deleting?.name}»? Si ya se ha vendido alguno no se podrá: desactívalo para que no se venda más.`}
        confirmLabel="Eliminar"
        pending={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success("Tipo de bono eliminado");
              setDeleting(null);
            },
            onError: (e) => toast.error("No se pudo eliminar", { description: e.message }),
          })
        }
      />
    </SettingsSection>
  );
}

// "4,00 € por sesión · ahorra 11 %" (sessions bonos, against the service's price)
function Savings({ type }: { type: BonoType }) {
  if (type.kind !== "sessions" || !type.sessions) return null;
  const perSession = type.priceCents / type.sessions;
  const saving = type.servicePriceCents ? 1 - perSession / type.servicePriceCents : 0;
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {formatPrice(Math.round(perSession))}/sesión{saving >= 0.01 ? ` · ahorra ${Math.round(saving * 100)} %` : ""}
    </span>
  );
}

const inputOf = (t: BonoType): BonoTypeInput => ({
  name: t.name,
  serviceId: t.serviceId ?? "",
  kind: t.kind,
  sessions: t.sessions,
  validityDays: t.validityDays,
  sessionsPerWeek: t.sessionsPerWeek,
  priceCents: t.priceCents,
  isActive: t.isActive,
});

// Caducidad options for sessions bonos (in days; 0 = never)
const validityOptions = [
  [0, "No caduca"],
  [30, "1 mes"],
  [60, "2 meses"],
  [90, "3 meses"],
  [180, "6 meses"],
  [365, "1 año"],
] as const;

function BonoTypeDialog({ value, onClose }: { value: BonoType | "new" | null; onClose: () => void }) {
  return (
    <Dialog open={!!value} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {value && <BonoTypeForm key={value === "new" ? "new" : value.id} initial={value === "new" ? null : value} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function BonoTypeForm({ initial, onClose }: { initial: BonoType | null; onClose: () => void }) {
  const { data: me } = useMe();
  const today = new Date().toISOString().slice(0, 10);
  const services = useCalendarConfig(me?.activeClinic?.clinicId, { from: today, to: today }).data?.services ?? [];
  const create = useCreateBonoType();
  const update = useUpdateBonoType();
  const pending = create.isPending || update.isPending;

  const [name, setName] = useState(initial?.name ?? "");
  const [serviceId, setServiceId] = useState(initial?.serviceId ?? "");
  const [kind, setKind] = useState<BonoKind>(initial?.kind ?? "sessions");
  const [sessions, setSessions] = useState(String(initial?.sessions ?? 10));
  const [validity, setValidity] = useState(String(initial?.validityDays ?? 0));
  const [perWeek, setPerWeek] = useState(String(initial?.sessionsPerWeek ?? 2));
  const [price, setPrice] = useState(initial ? centsToInput(initial.priceCents) : "");

  const cents = inputToCents(price);
  const sessionsNum = Number(sessions);
  const sessionsOk = kind === "monthly" || (Number.isInteger(sessionsNum) && sessionsNum >= 1 && sessionsNum <= 200);
  const ok = !!name.trim() && !!serviceId && sessionsOk && cents !== null && cents > 0;
  const servicePrice = services.find((s) => s.id === serviceId)?.priceCents;
  // A known validity that isn't in the list (set some other way) stays selectable
  const validityList = validityOptions.some(([d]) => String(d) === validity)
    ? validityOptions
    : [...validityOptions, [Number(validity), `${validity} días`] as const];

  const submit = () => {
    const body: BonoTypeInput = {
      name: name.trim(),
      serviceId,
      kind,
      sessions: kind === "sessions" ? sessionsNum : null,
      validityDays: kind === "sessions" && Number(validity) > 0 ? Number(validity) : null,
      sessionsPerWeek: kind === "monthly" && Number(perWeek) > 0 ? Number(perWeek) : null,
      priceCents: cents!,
      isActive: initial?.isActive ?? true,
    };
    const done = {
      onSuccess: () => {
        toast.success(initial ? "Bono guardado" : "Bono creado");
        onClose();
      },
      onError: (e: Error) => toast.error("No se pudo guardar", { description: e.message }),
    };
    if (initial) update.mutate({ ...body, id: initial.id }, done);
    else create.mutate(body, done);
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) submit();
      }}
    >
      <DialogHeader>
        <DialogTitle>{initial ? "Editar bono" : "Nuevo tipo de bono"}</DialogTitle>
        <DialogDescription>
          {initial ? "Los bonos ya vendidos no cambian." : "Cada bono es de un único servicio."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bono-name">Nombre</Label>
        <Input
          id="bono-name"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          placeholder={kind === "monthly" ? "Pilates 2 días por semana" : "Bono 10 sesiones"}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bono-service">Servicio</Label>
        <NativeSelect id="bono-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full">
          <NativeSelectOption value="">Elige un servicio</NativeSelectOption>
          {services.map((s) => (
            <NativeSelectOption key={s.id} value={s.id}>
              {s.name} ({formatPrice(s.priceCents)} la sesión)
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tipo</Label>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de bono">
          {(
            [
              ["sessions", "De sesiones", "X sesiones para usar"],
              ["monthly", "Mensual", "Un mes natural, del 1 al último día"],
            ] as const
          ).map(([k, label, hint]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                "flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors",
                kind === k ? "border-primary bg-primary/5" : "hover:bg-muted",
              )}
            >
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </button>
          ))}
        </div>
      </div>

      {kind === "sessions" ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bono-sessions">Sesiones</Label>
            <Input
              id="bono-sessions"
              type="number"
              min={1}
              max={200}
              value={sessions}
              onChange={(e) => setSessions(e.target.value)}
              aria-invalid={!sessionsOk}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bono-validity">Caducidad</Label>
            <NativeSelect id="bono-validity" value={validity} onChange={(e) => setValidity(e.target.value)} className="w-full">
              {validityList.map(([d, label]) => (
                <NativeSelectOption key={d} value={d}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="bono-week">Sesiones por semana</Label>
          <NativeSelect id="bono-week" value={perWeek} onChange={(e) => setPerWeek(e.target.value)} className="w-full">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <NativeSelectOption key={n} value={n}>
                {n} {n === 1 ? "sesión" : "sesiones"} por semana
              </NativeSelectOption>
            ))}
            <NativeSelectOption value={0}>Sin límite</NativeSelectOption>
          </NativeSelect>
          <p className="text-xs text-muted-foreground">
            Semanas de lunes a domingo. Las sesiones no usadas no pasan a la semana siguiente.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="bono-price">Precio</Label>
        <div className="relative">
          <Input
            id="bono-price"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-invalid={price !== "" && (cents === null || cents <= 0)}
            className="pr-7 tabular-nums"
            placeholder={kind === "monthly" ? "60" : "400"}
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">€</span>
        </div>
        {kind === "sessions" && cents && sessionsOk && servicePrice ? (
          <p className="text-xs text-muted-foreground">
            Sale a {formatPrice(Math.round(cents / sessionsNum))} la sesión (sin bono, {formatPrice(servicePrice)}).
          </p>
        ) : null}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-full" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" className="rounded-full" disabled={!ok || pending}>
          {pending && <Loader2 className="animate-spin" />}
          {initial ? "Guardar" : "Crear bono"}
        </Button>
      </DialogFooter>
    </form>
  );
}
