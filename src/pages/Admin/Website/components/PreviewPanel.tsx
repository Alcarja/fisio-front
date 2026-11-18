import { useEffect, useState } from "react";
import { ExternalLink, Eye, Loader2 } from "lucide-react";
import { getSitePreviewUrl } from "@/adapters/api";
import { cn } from "@/lib/utils";

type Props = {
  // False until the sites service runs (Phase 3): then there's nothing to show
  available: boolean;
  // Changes after every save (the site's updatedAt): load the preview again
  version: string;
  className?: string;
};

// The draft as visitors would see it, in a frame. Each load asks for a new
// 15-minute link (the frame stays on the last one if that fails)
export default function PreviewPanel({ available, version, className }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!available) return;
    let cancelled = false;
    getSitePreviewUrl()
      .then(({ url }) => !cancelled && (setUrl(url), setFailed(false)))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [available, version]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Eye className="size-4" />
          Vista previa
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Abrir en otra pestaña
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
      <div className="relative h-[70svh] min-h-96 overflow-hidden rounded-[1.75rem] border bg-muted">
        {!available ? (
          <p className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
            La vista previa estará disponible muy pronto. Mientras, puedes preparar todo el
            contenido.
          </p>
        ) : url ? (
          <iframe key={url} src={url} title="Vista previa de tu web" className="size-full bg-white" />
        ) : failed ? (
          <p className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
            No se pudo cargar la vista previa. Guarda de nuevo para reintentarlo.
          </p>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
