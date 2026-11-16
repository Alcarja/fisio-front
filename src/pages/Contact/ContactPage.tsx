import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { ChevronDown, CircleAlert, Loader2, Mail, MailCheck } from "lucide-react";
import type { TeamSize } from "@/adapters/api";
import { useSendContactRequest } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTACT_EMAIL } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";

const teamSizes: { value: TeamSize; label: string }[] = [
  { value: "solo", label: "Solo yo" },
  { value: "2-5", label: "De 2 a 5 personas" },
  { value: "6-15", label: "De 6 a 15 personas" },
  { value: "16+", label: "Más de 15 personas" },
];

const nextSteps = [
  { title: "Te escribimos", text: "En uno o dos días laborables, para conocer tu clínica." },
  { title: "Te lo enseñamos", text: "Una videollamada corta con la agenda de tu clínica en pantalla." },
  { title: "Te damos de alta", text: "Creamos tu clínica y en una tarde tienes servicios, salas y equipo listos." },
];

const MAX_MESSAGE = 2000;

const field = "h-11 rounded-xl bg-card px-4 text-base md:text-sm";

// Public page: clinics interested in Kineflow leave their details. The backend
// saves the request and emails it to the team (back/src/controllers/contact.controller.ts)
export default function ContactPage() {
  const send = useSendContactRequest();
  const [form, setForm] = useState({
    name: "",
    email: "",
    clinicName: "",
    phone: "",
    teamSize: "" as TeamSize | "",
    message: "",
    website: "", // trap for bots, hidden
  });
  const [accepted, setAccepted] = useState(false);
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      clinicName: form.clinicName.trim(),
      phone: form.phone.trim() || undefined,
      teamSize: form.teamSize || undefined,
      message: form.message.trim() || undefined,
      website: form.website || undefined,
    });
  };

  return (
    // overflow-x-clip: the glow mustn't widen the page on phones (clip, not
    // hidden, so the sticky intro keeps working)
    <div className="relative isolate overflow-x-clip">
      <div
        className="pointer-events-none absolute -top-24 left-0 -z-10 h-[30rem] w-[40rem] rounded-full bg-[radial-gradient(closest-side,var(--sage),transparent)] opacity-70"
        aria-hidden
      />

      <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-16 md:pt-24 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        {/* Intro */}
        <div className="flex flex-col gap-10 lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-col gap-6">
            <span className="text-sm font-medium text-coral motion-safe:animate-rise">Contacto</span>
            <h1
              className="font-display text-6xl leading-[0.95] tracking-tight text-balance motion-safe:animate-rise sm:text-7xl"
              style={{ animationDelay: "80ms" }}
            >
              Hablemos de tu <em className="text-coral">clínica</em>.
            </h1>
            <p
              className="max-w-md text-lg text-muted-foreground text-pretty motion-safe:animate-rise"
              style={{ animationDelay: "160ms" }}
            >
              Cuéntanos un poco sobre tu equipo y te enseñamos cómo encaja Kineflow en tu día a
              día.
            </p>
          </div>

          <ol className="flex flex-col border-t">
            {nextSteps.map((step, i) => (
              <li key={step.title} className="flex gap-4 border-b py-5">
                <span className="font-display text-lg text-muted-foreground tabular-nums">
                  0{i + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{step.title}</span>
                  <span className="text-sm text-muted-foreground">{step.text}</span>
                </div>
              </li>
            ))}
          </ol>

          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" />
            ¿Prefieres escribirnos?{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        {/* Form */}
        <section
          className="rounded-[2rem] border bg-card/70 p-6 shadow-[0_24px_48px_-24px_rgb(20_60_50/0.25)] backdrop-blur motion-safe:animate-rise sm:p-8"
          style={{ animationDelay: "240ms" }}
        >
          {send.isSuccess ? (
            <div className="flex min-h-[28rem] flex-col items-start justify-center gap-4" aria-live="polite">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                <MailCheck className="size-5 text-primary" />
              </span>
              <h2 className="font-display text-4xl leading-none tracking-tight">
                ¡Gracias, {form.name.trim().split(/\s+/)[0]}!
              </h2>
              <p className="text-muted-foreground">
                Hemos recibido tu mensaje. Te escribiremos a{" "}
                <span className="font-medium text-foreground">{form.email.trim()}</span> en uno o
                dos días laborables.
              </p>
              <Button asChild variant="outline" className="mt-2 h-11 rounded-full px-5">
                <Link to={paths.home}>Volver al inicio</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Nombre" htmlFor="contact-name">
                  <Input
                    id="contact-name"
                    autoComplete="name"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => set("name")(e.target.value)}
                    className={field}
                  />
                </Field>
                <Field label="Email" htmlFor="contact-email">
                  <Input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@clinica.com"
                    required
                    maxLength={200}
                    value={form.email}
                    onChange={(e) => set("email")(e.target.value)}
                    className={field}
                  />
                </Field>
              </div>

              <Field label="Nombre de la clínica" htmlFor="contact-clinic">
                <Input
                  id="contact-clinic"
                  autoComplete="organization"
                  required
                  maxLength={150}
                  value={form.clinicName}
                  onChange={(e) => set("clinicName")(e.target.value)}
                  className={field}
                />
              </Field>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Teléfono" htmlFor="contact-phone" optional>
                  <Input
                    id="contact-phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={30}
                    value={form.phone}
                    onChange={(e) => set("phone")(e.target.value)}
                    className={field}
                  />
                </Field>
                <Field label="Tamaño del equipo" htmlFor="contact-team" optional>
                  <div className="relative">
                    <select
                      id="contact-team"
                      value={form.teamSize}
                      onChange={(e) => set("teamSize")(e.target.value)}
                      className={cn(
                        field,
                        "w-full appearance-none border border-input pr-10 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        !form.teamSize && "text-muted-foreground",
                      )}
                    >
                      <option value="">Elige una opción</option>
                      {teamSizes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </Field>
              </div>

              <Field label="¿Qué te gustaría saber?" htmlFor="contact-message" optional>
                <textarea
                  id="contact-message"
                  rows={4}
                  maxLength={MAX_MESSAGE}
                  value={form.message}
                  onChange={(e) => set("message")(e.target.value)}
                  placeholder="Cuántas salas tenéis, cómo organizáis la agenda ahora…"
                  className="min-h-28 w-full resize-y rounded-xl border border-input bg-card px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                />
              </Field>

              {/* Trap for bots: invisible to people and to screen readers */}
              <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
                <label htmlFor="contact-website">No rellenes este campo</label>
                <input
                  id="contact-website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) => set("website")(e.target.value)}
                />
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="contact-privacy"
                  checked={accepted}
                  onCheckedChange={(checked) => setAccepted(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="contact-privacy" className="text-sm leading-snug font-normal text-muted-foreground">
                  Acepto que Kineflow use estos datos solo para responder a mi solicitud, como
                  explica la{" "}
                  <Link
                    to={paths.privacy}
                    target="_blank"
                    className="text-foreground underline underline-offset-4"
                  >
                    política de privacidad
                  </Link>
                  .
                </Label>
              </div>

              {send.error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  {send.error.message}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={!accepted || send.isPending}
                className="mt-1 h-12 rounded-full text-base"
              >
                {send.isPending ? (
                  <>
                    <Loader2 className="animate-spin" /> Enviando…
                  </>
                ) : (
                  "Enviar"
                )}
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  optional = false,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="flex items-baseline gap-1.5">
        {label}
        {optional && <span className="text-xs font-normal text-muted-foreground">(opcional)</span>}
      </Label>
      {children}
    </div>
  );
}
