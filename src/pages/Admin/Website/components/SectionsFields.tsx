import type { SiteSection } from "@/adapters/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { sectionLabels, SITE_LIMITS } from "../siteFormat";
import Field, { FieldGroup, type ContentProps } from "./Field";

// Which sections the website shows, and how it appears in Google
export default function SectionsFields({ content, onChange }: ContentProps) {
  const toggle = (section: SiteSection, on: boolean) =>
    onChange({ ...content, sections: { ...content.sections, [section]: on } });
  const seo = content.seo;

  return (
    <>
      <FieldGroup title="Secciones" description="Elige qué partes aparecen en tu web.">
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(sectionLabels) as SiteSection[]).map((section) => (
            <div key={section} className="flex items-start gap-3">
              <Checkbox
                id={`section-${section}`}
                checked={content.sections[section]}
                onCheckedChange={(v) => toggle(section, v === true)}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <Label htmlFor={`section-${section}`}>{sectionLabels[section].label}</Label>
                <span className="text-xs text-muted-foreground">{sectionLabels[section].hint}</span>
              </div>
            </div>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup
        title="En Google"
        description="Opcional. Si lo dejas vacío, se usan el nombre de la clínica y el subtítulo."
      >
        <Field
          label="Título"
          value={seo.title}
          max={SITE_LIMITS.seoTitle}
          placeholder="Fisioterapia en Valencia · Clínica Activa"
          onChange={(title) => onChange({ ...content, seo: { ...seo, title } })}
        />
        <Field
          label="Descripción"
          value={seo.description}
          max={SITE_LIMITS.seoDescription}
          multiline
          rows={2}
          onChange={(description) => onChange({ ...content, seo: { ...seo, description } })}
        />
      </FieldGroup>
    </>
  );
}
