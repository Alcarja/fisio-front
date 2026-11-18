import { useRef } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { getSiteImage, type SiteImageKind } from "@/adapters/api";
import { useUploadSiteImage } from "@/adapters/hook";
import AuthImage from "@/components/AuthImage";
import { cn } from "@/lib/utils";
import { compressSiteImage } from "../siteFormat";

type Props = {
  kind: SiteImageKind;
  imageId: string | undefined | null;
  // The new photo's id after uploading, or undefined when it's removed
  onChange: (id: string | undefined, file?: Blob) => void;
  label: string;
  className?: string; // size and aspect of the box
  contain?: boolean; // logos: show whole, not cropped
};

// One photo: the current one with a remove button, or a box to upload one.
// Compressed in the browser, then uploaded; the parent saves the id in the draft
export default function ImageSlot({ kind, imageId, onChange, label, className, contain }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadSiteImage();

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const image = await compressSiteImage(file, kind);
      const created = await upload.mutateAsync({ kind, image });
      onChange(created.id, image);
    } catch (error) {
      toast.error("No se pudo subir la foto", { description: (error as Error).message });
    } finally {
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border bg-muted", className)}>
      {imageId ? (
        <>
          <AuthImage
            load={() => getSiteImage(imageId)}
            version={imageId}
            alt={label}
            className={cn("size-full", contain && "object-contain p-3")}
          />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label={`Quitar ${label.toLowerCase()}`}
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
          >
            <X className="size-4" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={upload.isPending}
          className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center text-sm text-muted-foreground transition-colors hover:bg-secondary"
        >
          {upload.isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
          {upload.isPending ? "Subiendo…" : label}
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
