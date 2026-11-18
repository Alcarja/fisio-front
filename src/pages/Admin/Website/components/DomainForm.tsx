import { useState, type FormEvent } from "react";
import { Check, CircleAlert, Copy, Globe, Loader2, Mail, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SiteData, SiteDomain, SiteDomainError, SiteDomainHost } from "@/adapters/api";
import { useAddSiteDomain, useCheckSiteDomain, useRemoveSiteDomain, useSetSiteDomainPrimary } from "@/adapters/hook";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTACT_EMAIL } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { FieldGroup } from "./Field";

// The clinic's own domain (WEBS.md Phase 4): type it, add three DNS records at
// the domain provider, and we check them (every 10 minutes, or now).
// Mirrors back/src/lib/domains.ts

// What each problem means, in plain words
const ERRORS: Record<SiteDomainError, string> = {
  TXT_MISSING: "Falta el registro TXT _kineflow, o aún no se ha propagado (puede tardar unas horas).",
  A_WRONG: "El registro A de @ no apunta a nuestro servidor. Revisa su valor y borra los A anteriores.",
  AAAA_LEFTOVER: "Queda un registro AAAA antiguo (de tu web anterior). Bórralo.",
  WWW_WRONG: "www no apunta a nuestro servidor. Revisa el CNAME de www y borra los registros anteriores.",
};

const helpHref = (domain?: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Conectar mi dominio${domain ? ` ${domain}` : ""}`)}`;

// "https://www.tuclinica.es/" → "tuclinica.es" (the server cleans it again)
const cleanDomain = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .split(/[/?#]/)[0]!
    .replace(/\.$/, "")
    .replace(/^www\./, "");

export default function DomainForm({ data }: { data: SiteData }) {
  if (!data.domainsAvailable && !data.domain) {
    return (
      <FieldGroup title="Dominio propio" description="Por ejemplo, www.tuclinica.es.">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Globe className="mt-0.5 size-4 shrink-0" />
          Muy pronto podrás conectar tu propio dominio desde aquí.
        </p>
      </FieldGroup>
    );
  }
  return data.domain ? <ConnectedDomain domain={data.domain} /> : <AddDomain />;
}

// ---------- No domain yet ----------

function PrimaryChoice({ apex, value, onChange, disabled }: { apex: string; value: "apex" | "www"; onChange: (v: "apex" | "www") => void; disabled?: boolean }) {
  const options = [
    { key: "apex" as const, label: apex || "tuclinica.es" },
    { key: "www" as const, label: `www.${apex || "tuclinica.es"}` },
  ];
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Dirección principal</span>
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={value === o.key}
            disabled={disabled}
            onClick={() => onChange(o.key)}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-60",
              value === o.key ? "border-primary bg-primary/5" : "hover:bg-muted",
            )}
          >
            <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border", value === o.key && "border-primary bg-primary text-primary-foreground")}>
              {value === o.key && <Check className="size-3" />}
            </span>
            <span className="truncate">{o.label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">La otra versión redirige a esta automáticamente.</p>
    </div>
  );
}

function AddDomain() {
  const [value, setValue] = useState("");
  const [primary, setPrimary] = useState<"apex" | "www">("apex");
  const add = useAddSiteDomain();
  const domain = cleanDomain(value);
  const looksValid = /^[^\s.]+(\.[^\s.]+)+$/.test(domain);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!looksValid) return;
    add.mutate(
      { domain, primary },
      {
        onSuccess: () => toast.success("Dominio añadido", { description: "Ahora añade los registros DNS en tu proveedor." }),
        onError: (error) => toast.error("No se pudo añadir el dominio", { description: error.message }),
      },
    );
  };

  return (
    <FieldGroup
      title="Dominio propio"
      description="Si ya tienes un dominio (por ejemplo tuclinica.es), tu web puede estar en él. Lo compras donde quieras y lo conectas aquí."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="site-domain">Tu dominio</Label>
          <Input
            id="site-domain"
            value={value}
            placeholder="tuclinica.es"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={253}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <PrimaryChoice apex={domain} value={primary} onChange={setPrimary} disabled={add.isPending} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" className="rounded-full" disabled={!looksValid || add.isPending}>
            {add.isPending && <Loader2 className="animate-spin" />}
            Conectar dominio
          </Button>
          <a href={helpHref(domain || undefined)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Mail className="size-4" /> Lo conecto yo por ti
          </a>
        </div>
      </form>
    </FieldGroup>
  );
}

// ---------- A domain added ----------

function StatusBadge({ host }: { host: SiteDomainHost }) {
  if (host.status === "verified") {
    return (
      <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
        <Check /> Conectado
      </Badge>
    );
  }
  if (host.status === "error") {
    return (
      <Badge variant="destructive">
        <CircleAlert /> Revisa la configuración
      </Badge>
    );
  }
  return <Badge variant="secondary">Pendiente</Badge>;
}

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("No se pudo copiar. Selecciona el texto y cópialo a mano.");
    }
  };
  return (
    <div className="flex min-w-0 items-center gap-1">
      <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1 font-mono text-xs select-all" title={value}>
        {value}
      </code>
      <Button type="button" size="icon" variant="ghost" className="size-7 shrink-0" onClick={copy} aria-label={`Copiar ${value}`}>
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}

const timeAgo = (iso: string | null) => {
  if (!iso) return null;
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `hace ${hours} h` : new Date(iso).toLocaleDateString("es-ES");
};

function ConnectedDomain({ domain }: { domain: SiteDomain }) {
  const check = useCheckSiteDomain();
  const remove = useRemoveSiteDomain();
  const setPrimary = useSetSiteDomainPrimary();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const allVerified = domain.hosts.every((h) => h.status === "verified");
  const lastChecked = domain.hosts.map((h) => h.lastCheckedAt).filter(Boolean).sort().at(-1) ?? null;

  const runCheck = () =>
    check.mutate(undefined, {
      onSuccess: (data) => {
        const ok = data.domain?.hosts.every((h) => h.status === "verified");
        if (ok) toast.success("Tu dominio está conectado");
        else toast.info("Todavía no está listo", { description: "Revisa los registros marcados. Los cambios de DNS pueden tardar unas horas." });
      },
      onError: (error) => toast.error("No se pudo comprobar", { description: error.message }),
    });

  return (
    <FieldGroup
      title="Dominio propio"
      description={allVerified ? "Tu web se ve en tu dominio. Las demás direcciones redirigen a él." : "Añade estos registros en el panel de tu proveedor de dominio. Los comprobamos cada 10 minutos."}
    >
      <ul className="flex flex-col gap-2">
        {domain.hosts.map((h) => (
          <li key={h.hostname} className="flex flex-col gap-1.5 rounded-xl border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <span className="truncate">{h.hostname}</span>
                {h.isPrimary && <Badge variant="outline">Principal</Badge>}
              </span>
              <StatusBadge host={h} />
            </div>
            {h.status !== "verified" && h.lastError && <p className="text-xs text-muted-foreground">{ERRORS[h.lastError]}</p>}
            {h.status === "verified" && h.lastError && (
              <p className="text-xs text-amber-700 dark:text-amber-400">Hemos detectado un problema en la última comprobación: {ERRORS[h.lastError]}</p>
            )}
          </li>
        ))}
      </ul>

      {!allVerified && (
        <>
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-[4.5rem_6rem_minmax(0,1fr)] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>Tipo</span>
              <span>Nombre</span>
              <span>Valor</span>
            </div>
            {domain.records.map((r) => (
              <div key={r.type} className="grid grid-cols-[4.5rem_6rem_minmax(0,1fr)] items-center gap-3 border-b px-3 py-2 text-sm last:border-0">
                <span className="font-medium">{r.type}</span>
                <CopyValue value={r.name} />
                <CopyValue value={r.value} />
              </div>
            ))}
          </div>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-xs text-muted-foreground">
            <li>Borra los registros A, AAAA o CNAME anteriores de @ y www (los de tu web antigua).</li>
            <li>
              <strong className="font-medium text-foreground">No toques los registros MX</strong>: son los de tu correo.
            </li>
            <li>En algunos proveedores el nombre @ aparece vacío o como tu dominio completo.</li>
          </ul>
        </>
      )}

      <div className="flex flex-col gap-3 border-t pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant={allVerified ? "outline" : "default"} className="rounded-full" onClick={runCheck} disabled={check.isPending}>
            {check.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Comprobar ahora
          </Button>
          {!allVerified && (
            <Button asChild variant="ghost" className="rounded-full">
              <a href={helpHref(domain.apex)}>
                <Mail /> Lo conecto yo por ti
              </a>
            </Button>
          )}
          <Button type="button" variant="ghost" className="ml-auto rounded-full text-destructive hover:text-destructive" onClick={() => setConfirmRemove(true)}>
            <Trash2 /> Quitar
          </Button>
        </div>
        {lastChecked && <p className="text-xs text-muted-foreground">Última comprobación {timeAgo(lastChecked)}.</p>}
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Dirección principal:</span>
          <select
            className="rounded-lg border bg-background px-2 py-1 text-sm"
            value={domain.primary}
            disabled={setPrimary.isPending}
            onChange={(e) =>
              setPrimary.mutate(e.target.value as "apex" | "www", {
                onError: (error) => toast.error("No se pudo cambiar", { description: error.message }),
              })
            }
          >
            <option value="apex">{domain.apex}</option>
            <option value="www">www.{domain.apex}</option>
          </select>
        </label>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="¿Quitar tu dominio?"
        description={`Tu web dejará de verse en ${domain.apex} y volverá a su dirección gratuita. El dominio sigue siendo tuyo.`}
        confirmLabel="Quitar dominio"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              setConfirmRemove(false);
              toast.success("Dominio quitado");
            },
            onError: (error) => toast.error("No se pudo quitar", { description: error.message }),
          })
        }
      />
    </FieldGroup>
  );
}
