import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_LIMITS } from "../siteFormat";
import Field, { FieldGroup, type ContentProps } from "./Field";

// Title, presentation, "Por qué nosotros" and FAQ. All plain text: line breaks
// become paragraphs on the website
export default function TextsFields({ content, onChange }: ContentProps) {
  const { hero, about, highlights, faq } = content;
  const set = (patch: Partial<typeof content>) => onChange({ ...content, ...patch });

  const setHighlight = (i: number, patch: Partial<(typeof highlights)[number]>) =>
    set({ highlights: highlights.map((h, j) => (j === i ? { ...h, ...patch } : h)) });
  const setFaq = (i: number, patch: Partial<(typeof faq)[number]>) =>
    set({ faq: faq.map((f, j) => (j === i ? { ...f, ...patch } : f)) });

  return (
    <>
      <FieldGroup title="Portada" description="Lo primero que se lee. Di qué haces y dónde, en pocas palabras.">
        <Field
          label="Título principal"
          value={hero.title}
          max={SITE_LIMITS.heroTitle}
          placeholder="Fisioterapia en el centro de Valencia"
          onChange={(title) => set({ hero: { ...hero, title } })}
        />
        <Field
          label="Subtítulo"
          value={hero.subtitle}
          max={SITE_LIMITS.heroSubtitle}
          multiline
          rows={2}
          onChange={(subtitle) => set({ hero: { ...hero, subtitle } })}
        />
      </FieldGroup>

      <FieldGroup title="Quiénes somos">
        <Field
          label="Título"
          value={about?.title}
          max={SITE_LIMITS.aboutTitle}
          placeholder="Quiénes somos"
          onChange={(title) => set({ about: { text: about?.text ?? "", ...about, title } })}
        />
        <Field
          label="Texto"
          value={about?.text}
          max={SITE_LIMITS.aboutText}
          multiline
          rows={6}
          hint="Cada salto de línea será un párrafo nuevo."
          onChange={(text) => set({ about: { ...about, text } })}
        />
      </FieldGroup>

      <FieldGroup title="Por qué nosotros" description={`Hasta ${SITE_LIMITS.highlights} puntos fuertes de tu clínica.`}>
        {highlights.map((h, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl border p-4">
            <div className="flex items-start gap-2">
              <Field
                className="flex-1"
                label={`Punto ${i + 1}`}
                value={h.title}
                max={SITE_LIMITS.highlightTitle}
                onChange={(title) => setHighlight(i, { title })}
              />
              <RemoveButton
                label={`Quitar el punto ${i + 1}`}
                onClick={() => set({ highlights: highlights.filter((_, j) => j !== i) })}
              />
            </div>
            <Field
              label="Explicación (opcional)"
              value={h.text}
              max={SITE_LIMITS.highlightText}
              multiline
              rows={2}
              onChange={(text) => setHighlight(i, { text })}
            />
          </div>
        ))}
        {highlights.length < SITE_LIMITS.highlights && (
          <AddButton onClick={() => set({ highlights: [...highlights, { title: "" }] })}>
            Añadir punto
          </AddButton>
        )}
      </FieldGroup>

      <FieldGroup title="Preguntas frecuentes" description={`Hasta ${SITE_LIMITS.faq}. Ayudan a tus pacientes y a aparecer en Google.`}>
        {faq.map((f, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl border p-4">
            <div className="flex items-start gap-2">
              <Field
                className="flex-1"
                label={`Pregunta ${i + 1}`}
                value={f.q}
                max={SITE_LIMITS.faqQuestion}
                onChange={(q) => setFaq(i, { q })}
              />
              <RemoveButton
                label={`Quitar la pregunta ${i + 1}`}
                onClick={() => set({ faq: faq.filter((_, j) => j !== i) })}
              />
            </div>
            <Field
              label="Respuesta"
              value={f.a}
              max={SITE_LIMITS.faqAnswer}
              multiline
              rows={3}
              onChange={(a) => setFaq(i, { a })}
            />
          </div>
        ))}
        {faq.length < SITE_LIMITS.faq && (
          <AddButton onClick={() => set({ faq: [...faq, { q: "", a: "" }] })}>Añadir pregunta</AddButton>
        )}
      </FieldGroup>
    </>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <Button type="button" variant="outline" className="w-fit rounded-full" onClick={onClick}>
      <Plus />
      {children}
    </Button>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      className="mt-6 shrink-0 rounded-full text-muted-foreground"
      onClick={onClick}
    >
      <Trash2 />
    </Button>
  );
}
