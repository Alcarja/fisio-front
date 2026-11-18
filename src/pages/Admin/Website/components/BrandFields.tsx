import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { colorPresets, dominantColor, fontOptions } from "../siteFormat";
import { FieldGroup, type ContentProps } from "./Field";
import ImageSlot from "./ImageSlot";

// Logo, main colour and letter style
export default function BrandFields({ content, onChange }: ContentProps) {
  // The logo's main colour, offered after uploading it
  const [suggested, setSuggested] = useState<string | null>(null);
  const setTheme = (theme: Partial<typeof content.theme>) =>
    onChange({ ...content, theme: { ...content.theme, ...theme } });
  const primary = content.theme.primary;

  return (
    <>
      <FieldGroup title="Logo" description="Se ve arriba en tu web. Mejor con fondo transparente (PNG).">
        <ImageSlot
          kind="logo"
          imageId={content.logoId}
          label="Subir logo"
          contain
          className="h-32 w-56"
          onChange={async (id, file) => {
            onChange({ ...content, logoId: id }, { save: true });
            setSuggested(file ? await dominantColor(file).catch(() => null) : null);
          }}
        />
      </FieldGroup>

      <FieldGroup title="Color principal" description="Botones, enlaces y detalles de tu web.">
        {suggested && suggested !== primary && (
          <button
            type="button"
            onClick={() => setTheme({ primary: suggested })}
            className="flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Sparkles className="size-4 text-coral" />
            Usar el color de tu logo
            <span className="size-5 rounded-full border" style={{ backgroundColor: suggested }} />
          </button>
        )}
        <div role="radiogroup" aria-label="Color principal" className="flex flex-wrap items-center gap-2">
          {colorPresets.map((color) => {
            const selected = primary === color;
            return (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={color}
                onClick={() => setTheme({ primary: color })}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow",
                  selected ? "ring-2 ring-foreground" : "hover:ring-2 hover:ring-border",
                )}
                style={{ backgroundColor: color }}
              >
                {selected && <Check className="size-4 text-white" />}
              </button>
            );
          })}
          <label className="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-muted">
            <input
              type="color"
              value={primary}
              onChange={(e) => setTheme({ primary: e.target.value.toLowerCase() })}
              className="size-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
            />
            Otro color
          </label>
        </div>
      </FieldGroup>

      <FieldGroup title="Estilo de letra">
        <div role="radiogroup" aria-label="Estilo de letra" className="grid gap-2 sm:grid-cols-3">
          {fontOptions.map((font) => {
            const selected = content.theme.font === font.value;
            return (
              <button
                key={font.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme({ font: font.value })}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
                  selected ? "border-primary bg-secondary" : "hover:bg-muted",
                )}
              >
                <span className={cn("text-2xl", font.className)}>Aa</span>
                <Label className="pointer-events-none">{font.label}</Label>
                <span className="text-xs text-muted-foreground">{font.hint}</span>
              </button>
            );
          })}
        </div>
      </FieldGroup>
    </>
  );
}
