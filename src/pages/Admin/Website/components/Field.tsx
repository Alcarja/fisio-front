import { useId, type ReactNode } from "react";
import type { SiteContent } from "@/adapters/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// What every block of fields in Mi web receives. `save`: store the draft right
// away (after an image changes, so the uploaded photo is never left unused)
export type ContentProps = {
  content: SiteContent;
  onChange: (next: SiteContent, options?: { save?: boolean }) => void;
};

type Props = {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  max: number;
  hint?: ReactNode;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  type?: "text" | "email" | "tel" | "url";
  className?: string;
};

// A labelled text field with a character counter near the limit
export default function Field({
  label,
  value = "",
  onChange,
  max,
  hint,
  placeholder,
  multiline,
  rows = 4,
  type = "text",
  className,
}: Props) {
  const id = useId();
  const nearLimit = value.length > max * 0.8;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {nearLimit && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {value.length}/{max}
          </span>
        )}
      </div>
      {multiline ? (
        <Textarea
          id={id}
          rows={rows}
          maxLength={max}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={type}
          maxLength={max}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// A titled group of fields inside a tab or a wizard step
export function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-[1.75rem] border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
