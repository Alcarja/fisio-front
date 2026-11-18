import { CircleAlert } from "lucide-react";
import type { SiteLegal } from "@/adapters/api";
import { SITE_LIMITS } from "../siteFormat";
import Field, { FieldGroup, type ContentProps } from "./Field";

type Props = ContentProps & {
  legal: SiteLegal | null;
  legalMissing: string[];
};

// How to reach the clinic, its health registration, and the legal details
// from Plataforma (read only: Kineflow keeps them, the legal notice uses them)
export default function ContactFields({ content, onChange, legal, legalMissing }: Props) {
  const contact = content.contact;
  const setContact = (patch: Partial<typeof contact>) =>
    onChange({ ...content, contact: { ...contact, ...patch } });

  return (
    <>
      <FieldGroup title="Contacto" description="Hace falta al menos un teléfono o un email.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono" type="tel" value={contact.phone} max={30} onChange={(phone) => setContact({ phone })} />
          <Field
            label="WhatsApp"
            type="tel"
            value={contact.whatsapp}
            max={30}
            hint="Con prefijo si no es español, p. ej. +34 600 000 000."
            onChange={(whatsapp) => setContact({ whatsapp })}
          />
          <Field label="Email" type="email" value={contact.email} max={200} onChange={(email) => setContact({ email })} className="sm:col-span-2" />
          <Field label="Dirección" value={contact.address} max={SITE_LIMITS.address} onChange={(address) => setContact({ address })} className="sm:col-span-2" />
          <Field label="Código postal" value={contact.postalCode} max={SITE_LIMITS.postalCode} onChange={(postalCode) => setContact({ postalCode })} />
          <Field label="Ciudad" value={contact.city} max={SITE_LIMITS.city} onChange={(city) => setContact({ city })} />
          <Field
            label="Enlace de Google Maps"
            type="url"
            value={contact.mapsUrl}
            max={500}
            placeholder="https://maps.app.goo.gl/…"
            hint="En Google Maps: busca tu clínica → Compartir → Copiar enlace."
            onChange={(mapsUrl) => setContact({ mapsUrl })}
            className="sm:col-span-2"
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Redes sociales" description="Tu usuario (@clinica) o el enlace a tu perfil.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Instagram" value={contact.instagram} max={500} placeholder="@tuclinica" onChange={(instagram) => setContact({ instagram })} />
          <Field label="Facebook" value={contact.facebook} max={500} placeholder="@tuclinica" onChange={(facebook) => setContact({ facebook })} />
          <Field label="LinkedIn" value={contact.linkedin} max={500} placeholder="https://linkedin.com/…" onChange={(linkedin) => setContact({ linkedin })} />
        </div>
      </FieldGroup>

      <FieldGroup
        title="Datos legales"
        description="Salen en el aviso legal y el pie de tu web. Los gestiona Kineflow con lo que firmaste."
      >
        <Field
          label="Nº de registro sanitario"
          value={content.healthRegistry}
          max={SITE_LIMITS.healthRegistry}
          placeholder="CS-12345"
          hint="La publicidad sanitaria lo exige en la mayoría de comunidades autónomas."
          onChange={(healthRegistry) => onChange({ ...content, healthRegistry })}
        />
        <dl className="grid gap-x-6 gap-y-3 rounded-2xl bg-muted/50 p-4 text-sm sm:grid-cols-2">
          <LegalRow label="Titular" value={legal?.legalName} />
          <LegalRow label="NIF/CIF" value={legal?.taxId} />
          <LegalRow
            label="Dirección"
            value={[legal?.address, legal?.postalCode, legal?.city].filter(Boolean).join(", ")}
            wide
          />
        </dl>
        {legalMissing.length > 0 ? (
          <p className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            Faltan datos ({legalMissing.join(", ")}). Sin ellos no se puede publicar la web:
            escríbenos y los completamos.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Si algo no es correcto, escríbenos.</p>
        )}
      </FieldGroup>
    </>
  );
}

function LegalRow({ label, value, wide }: { label: string; value: string | null | undefined; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={value ? "" : "text-muted-foreground italic"}>{value || "Sin completar"}</dd>
    </div>
  );
}
