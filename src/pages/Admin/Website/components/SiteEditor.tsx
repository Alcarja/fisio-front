import { useState } from "react";
import { CircleAlert, ExternalLink, Loader2, PowerOff } from "lucide-react";
import { toast } from "sonner";
import type { SiteData } from "@/adapters/api";
import { usePublishSite, useUnpublishSite } from "@/adapters/hook";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statusLabels } from "../siteFormat";
import { useDraft } from "../useDraft";
import BrandFields from "./BrandFields";
import ContactFields from "./ContactFields";
import { FieldGroup } from "./Field";
import PhotosFields from "./PhotosFields";
import PreviewPanel from "./PreviewPanel";
import SectionsFields from "./SectionsFields";
import SubdomainForm from "./SubdomainForm";
import TeamEditor from "./TeamEditor";
import TemplatePicker from "./TemplatePicker";
import TextsFields from "./TextsFields";

const TABS = [
  { key: "design", label: "Diseño" },
  { key: "content", label: "Contenido" },
  { key: "team", label: "Equipo" },
  { key: "address", label: "Dirección" },
] as const;
type Tab = (typeof TABS)[number]["key"];

// Mi web after the first time: tabs with every setting, the preview beside
// them, and a bar with the status and "Publicar cambios"
export default function SiteEditor({ data }: { data: SiteData }) {
  const draft = useDraft(data);
  const publish = usePublishSite();
  const unpublish = useUnpublishSite();
  const [tab, setTab] = useState<Tab>("design");
  const [confirmOffline, setConfirmOffline] = useState(false);
  const { site } = data;
  const isLive = site.status === "published";
  // Something to publish: unsaved edits, saved edits, or the site isn't live
  const canPublish = draft.dirty || site.hasUnpublishedChanges || !isLive;

  const save = () =>
    draft
      .save()
      .then(() => toast.success("Borrador guardado"))
      .catch((error: Error) => toast.error("No se pudo guardar", { description: error.message }));

  const doPublish = async () => {
    try {
      if (draft.dirty) await draft.save();
      await publish.mutateAsync();
      toast.success("Web publicada", { description: "Los cambios ya se ven en tu web." });
    } catch (error) {
      toast.error("No se pudo publicar", { description: (error as Error).message });
    }
  };

  const goOffline = () =>
    unpublish.mutate(undefined, {
      onSuccess: () => {
        setConfirmOffline(false);
        toast.success("Web desconectada");
      },
      onError: (error) => toast.error("No se pudo desconectar", { description: error.message }),
    });

  const props = { content: draft.content, onChange: draft.onChange };

  return (
    <div className="flex flex-col gap-6">
      {/* Status bar: stays visible while scrolling the fields */}
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-[1.75rem] md:border md:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Badge variant={isLive ? "default" : site.status === "offline" ? "destructive" : "secondary"}>
            {statusLabels[site.status]}
          </Badge>
          {isLive ? (
            <a
              href={data.publicUrl}
              target="_blank"
              rel="noopener"
              className="flex min-w-0 items-center gap-1 truncate text-sm text-muted-foreground hover:text-foreground"
            >
              {new URL(data.publicUrl).hostname}
              <ExternalLink className="size-3.5 shrink-0" />
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">
              {site.status === "offline" ? "Nadie puede verla ahora." : "Aún no está publicada."}
            </span>
          )}
          {draft.dirty && <span className="text-xs text-coral">Cambios sin guardar</span>}
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground"
              aria-label="Desconectar web"
              title="Desconectar web"
              onClick={() => setConfirmOffline(true)}
            >
              <PowerOff />
            </Button>
          )}
          {draft.dirty && (
            <Button type="button" variant="outline" className="rounded-full" disabled={draft.saving} onClick={save}>
              {draft.saving && <Loader2 className="animate-spin" />}
              Guardar
            </Button>
          )}
          <Button
            type="button"
            className="rounded-full"
            disabled={!canPublish || publish.isPending || draft.saving}
            onClick={doPublish}
          >
            {publish.isPending && <Loader2 className="animate-spin" />}
            {isLive ? "Publicar cambios" : "Publicar"}
          </Button>
        </div>
      </div>

      {data.problems.length > 0 && (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <span className="flex items-center gap-2 font-medium">
            <CircleAlert className="size-4" />
            Para publicar falta:
          </span>
          <ul className="list-disc pl-6">
            {data.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          {/* Tabs */}
          <nav aria-label="Secciones de Mi web" className="flex gap-1 overflow-x-auto rounded-full border bg-card p-1 [scrollbar-width:none]">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={tab === t.key ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm transition-colors",
                  tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {tab === "design" && (
            <>
              <FieldGroup title="Plantilla" description="Puedes cambiarla cuando quieras: tus textos y fotos se mantienen.">
                <TemplatePicker templates={data.templates} value={draft.template} onChange={draft.setTemplate} />
              </FieldGroup>
              <BrandFields {...props} />
            </>
          )}
          {tab === "content" && (
            <>
              <TextsFields {...props} />
              <PhotosFields {...props} />
              <ContactFields {...props} legal={data.legal} legalMissing={data.legalMissing} />
              <SectionsFields {...props} />
            </>
          )}
          {tab === "team" && <TeamEditor />}
          {tab === "address" && <SubdomainForm site={site} publicUrl={data.publicUrl} />}
        </div>

        <PreviewPanel
          available={data.previewAvailable}
          version={site.updatedAt}
          className="xl:sticky xl:top-20 xl:self-start"
        />
      </div>

      <ConfirmDialog
        open={confirmOffline}
        onOpenChange={setConfirmOffline}
        title="¿Desconectar tu web?"
        description="Nadie podrá verla hasta que la vuelvas a publicar. Tu contenido se mantiene."
        confirmLabel="Desconectar"
        onConfirm={goOffline}
        pending={unpublish.isPending}
      />
    </div>
  );
}
