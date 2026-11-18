import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SiteData } from "@/adapters/api";
import { useChangeSiteSubdomain } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DomainForm from "./DomainForm";
import { FieldGroup } from "./Field";

const PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

// The free address <subdomain>.sites.kineflow.es, and the clinic's own domain
export default function SubdomainForm({ data }: { data: SiteData }) {
  const { site } = data;
  const [value, setValue] = useState(site.subdomain);
  const change = useChangeSiteSubdomain();
  // The domain after the subdomain, from the public URL (sites.kineflow.es)
  const base = new URL(data.subdomainUrl).hostname.slice(site.subdomain.length + 1);
  const subdomain = value.trim().toLowerCase();
  const valid = PATTERN.test(subdomain);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid || subdomain === site.subdomain) return;
    change.mutate(subdomain, {
      onSuccess: () => toast.success("Dirección cambiada", { description: `${subdomain}.${base}` }),
      onError: (error) => toast.error("No se pudo cambiar la dirección", { description: error.message }),
    });
  };

  return (
    <>
      <FieldGroup
        title="Dirección gratuita"
        description="Tu web siempre tiene esta dirección, aunque después conectes tu propio dominio."
      >
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Label htmlFor="site-subdomain">Dirección</Label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-lg border bg-background pr-3 focus-within:ring-3 focus-within:ring-ring/50">
              <Input
                id="site-subdomain"
                value={value}
                maxLength={63}
                autoCapitalize="none"
                spellCheck={false}
                onChange={(e) => setValue(e.target.value)}
                aria-invalid={!valid}
                className="border-0 shadow-none focus-visible:ring-0"
              />
              <span className="shrink-0 text-sm text-muted-foreground">.{base}</span>
            </div>
            <Button
              type="submit"
              className="rounded-full"
              disabled={!valid || subdomain === site.subdomain || change.isPending}
            >
              {change.isPending && <Loader2 className="animate-spin" />}
              Cambiar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Letras minúsculas, números y guiones. Si cambias la dirección, la anterior deja de
            funcionar al momento: actualiza tus tarjetas y redes.
          </p>
        </form>
      </FieldGroup>

      <DomainForm data={data} />
    </>
  );
}
