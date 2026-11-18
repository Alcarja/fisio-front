import { useState } from "react";
import { ArrowLeft, ArrowRight, CircleAlert, ExternalLink, Loader2, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import type { SiteData } from "@/adapters/api";
import { usePublishSite } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDraft } from "../useDraft";
import BrandFields from "./BrandFields";
import ContactFields from "./ContactFields";
import PhotosFields from "./PhotosFields";
import PreviewPanel from "./PreviewPanel";
import TemplatePicker from "./TemplatePicker";
import TextsFields from "./TextsFields";

const STEPS = ["Plantilla", "Marca", "Fotos", "Textos", "Contacto", "Publicar"];

type Props = {
  data: SiteData;
  // To the editor: "skip" from any step, or after publishing
  onFinish: () => void;
};

// First time in Mi web: six short steps, saving the draft at each one
export default function OnboardingWizard({ data, onFinish }: Props) {
  const draft = useDraft(data);
  const publish = usePublishSite();
  const [step, setStep] = useState(0);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const isLast = step === STEPS.length - 1;
  // The legal notice needs them: Kineflow fills them in, the clinic can't
  const blockedByLegal = STEPS[step] === "Contacto" && data.legalMissing.length > 0;

  const next = async () => {
    try {
      if (draft.dirty) await draft.save();
      setStep((s) => s + 1);
      window.scrollTo({ top: 0 });
    } catch (error) {
      toast.error("No se pudo guardar", { description: (error as Error).message });
    }
  };

  const skip = async () => {
    try {
      if (draft.dirty) await draft.save();
      onFinish();
    } catch (error) {
      toast.error("No se pudo guardar", { description: (error as Error).message });
    }
  };

  const doPublish = async () => {
    try {
      if (draft.dirty) await draft.save();
      const result = await publish.mutateAsync();
      setPublishedUrl(result.publicUrl);
    } catch (error) {
      toast.error("No se pudo publicar", { description: (error as Error).message });
    }
  };

  if (publishedUrl) {
    return (
      <section className="flex flex-col items-center gap-4 rounded-[2rem] border bg-card p-8 text-center sm:p-12">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
          <PartyPopper className="size-5 text-primary" />
        </span>
        <h2 className="font-display text-4xl leading-none tracking-tight">¡Tu web está publicada!</h2>
        <a
          href={publishedUrl}
          target="_blank"
          rel="noopener"
          className="flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
        >
          {new URL(publishedUrl).hostname}
          <ExternalLink className="size-4" />
        </a>
        <p className="max-w-md text-sm text-muted-foreground">
          Compártela en tus redes y en Google. Muy pronto podrás conectar también tu propio
          dominio (www.tuclinica.es).
        </p>
        <Button className="rounded-full" onClick={onFinish}>
          Ir al editor
        </Button>
      </section>
    );
  }

  const props = { content: draft.content, onChange: draft.onChange };

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Paso {step + 1} de {STEPS.length} ·{" "}
            <span className="font-medium text-foreground">{STEPS[step]}</span>
          </span>
          <button
            type="button"
            onClick={skip}
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Ir al editor completo
          </button>
        </div>
        <div className="flex gap-1.5" aria-hidden>
          {STEPS.map((name, i) => (
            <span
              key={name}
              className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")}
            />
          ))}
        </div>
      </div>

      {step === 0 && (
        <TemplatePicker templates={data.templates} value={draft.template} onChange={draft.setTemplate} />
      )}
      {step === 1 && <BrandFields {...props} />}
      {step === 2 && (
        <>
          <PhotosFields {...props} />
          <p className="text-sm text-muted-foreground">
            ¿No tienes fotos ahora? Sigue adelante: tu web se ve bien sin ellas y puedes añadirlas
            cuando quieras.
          </p>
        </>
      )}
      {step === 3 && <TextsFields {...props} />}
      {step === 4 && <ContactFields {...props} legal={data.legal} legalMissing={data.legalMissing} />}
      {step === 5 && (
        <>
          <PreviewPanel available={data.previewAvailable} version={data.site.updatedAt} />
          {data.problems.length > 0 && (
            <div
              role="alert"
              className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <span className="flex items-center gap-2 font-medium">
                <CircleAlert className="size-4" />
                Antes de publicar:
              </span>
              <ul className="list-disc pl-6">
                {data.problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <Button
          type="button"
          variant="ghost"
          className="rounded-full"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          <ArrowLeft />
          Atrás
        </Button>
        {isLast ? (
          <Button
            type="button"
            className="h-11 rounded-full px-6"
            disabled={data.problems.length > 0 || publish.isPending || draft.saving}
            onClick={doPublish}
          >
            {publish.isPending && <Loader2 className="animate-spin" />}
            Publicar mi web
          </Button>
        ) : (
          <Button
            type="button"
            className="rounded-full"
            disabled={draft.saving || blockedByLegal}
            onClick={next}
          >
            {draft.saving && <Loader2 className="animate-spin" />}
            Siguiente
            <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
