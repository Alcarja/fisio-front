import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  // Fetches the image with the session cookie (a plain <img> can't send it
  // to the API in every setup)
  load: () => Promise<Blob>;
  // Changes when the image changes (e.g. its updatedAt), to load it again
  version: string;
  alt: string;
  className?: string;
};

// An image from a logged-in API route, shown from memory
export default function AuthImage({ load, version, alt, className }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setFailed(false);
    load()
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // `load` is a new function on every render: `version` decides
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  if (failed) {
    return (
      <span className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <ImageOff className="size-4" />
      </span>
    );
  }
  if (!url) return <span className={cn("animate-pulse bg-muted", className)} />;
  return <img src={url} alt={alt} className={cn("object-cover", className)} />;
}
