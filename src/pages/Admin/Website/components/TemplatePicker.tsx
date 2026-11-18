import { useState } from "react";
import { Check, LayoutTemplate } from "lucide-react";
import type { SiteTemplate } from "@/adapters/api";
import { cn } from "@/lib/utils";

type Props = {
  templates: SiteTemplate[];
  value: string;
  onChange: (key: string) => void;
};

// The templates as cards with their preview image. Switching keeps every text
// and photo: all templates use the same content
export default function TemplatePicker({ templates, value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Plantilla" className="grid gap-3 sm:grid-cols-2">
      {templates.map((t) => {
        const selected = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(t.key)}
            className={cn(
              "flex flex-col overflow-hidden rounded-2xl border text-left transition-colors",
              selected ? "border-primary ring-2 ring-primary/30" : "hover:bg-muted",
            )}
          >
            <Preview templateKey={t.key} label={t.label} />
            <span className="flex items-start justify-between gap-3 p-4">
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">
                  {t.label}
                  {!t.public && (
                    <span className="ml-2 text-xs font-normal text-coral">A medida</span>
                  )}
                </span>
                <span className="text-sm text-muted-foreground">{t.description}</span>
              </span>
              {selected && (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// front/public/site-templates/<key>.webp, or a plain placeholder until it exists
function Preview({ templateKey, label }: { templateKey: string; label: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) {
    return (
      <span className="flex aspect-[16/10] items-center justify-center gap-2 bg-secondary text-sm text-primary/70">
        <LayoutTemplate className="size-5" />
        {label}
      </span>
    );
  }
  return (
    <img
      src={`/site-templates/${templateKey}.webp`}
      alt={`Vista de la plantilla ${label}`}
      onError={() => setMissing(true)}
      className="aspect-[16/10] w-full bg-secondary object-cover object-top"
    />
  );
}
