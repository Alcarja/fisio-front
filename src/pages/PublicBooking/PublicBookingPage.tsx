import { useState, type FormEvent } from "react";
import { generatePath, Link, useParams } from "react-router";
import { CalendarCheck, CalendarX, CircleAlert, Loader2 } from "lucide-react";
import { useCreatePublicBooking, usePublicBooking } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { paths } from "@/routes/paths";
import { cancellationNote, formatDuration, formatLongDate, formatPrice } from "./bookingFormat";
import Choice from "./components/Choice";
import Message from "./components/Message";
import SlotPicker from "./components/SlotPicker";
import Step from "./components/Step";

const MAX_NOTES = 500; // same as the backend

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  notes: "",
  website: "", // trap for bots, hidden
};

// Public page behind a clinic's booking link or QR (/reservar/:slug): the
// patient picks a service, a professional, a day and a time, and leaves their
// details. Backend: back/src/controllers/publicBooking.controller.ts
export default function PublicBookingPage() {
  const { slug } = useParams();
  const { data: booking, isPending, error } = usePublicBooking(slug);
  const create = useCreatePublicBooking();

  const [serviceId, setServiceId] = useState<string | null>(null);
  // null: anyone available
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [consent, setConsent] = useState(false);
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Unknown clinic, or online booking switched off
  if (error || !slug) {
    return (
      <Message icon={<CalendarX className="size-5 text-primary" />} title="Reservas no disponibles">
        Esta clínica no acepta reservas online en este momento. Ponte en contacto con ella para
        pedir tu cita.
      </Message>
    );
  }

  if (create.isSuccess && create.data) {
    const done = create.data;
    return (
      <Message icon={<CalendarCheck className="size-5 text-primary" />} title="¡Cita reservada!">
        <span className="flex flex-col gap-4">
          <span>
            Te esperamos en <strong className="text-foreground">{done.clinicName}</strong>.
          </span>
          <span className="flex flex-col gap-1 rounded-2xl border bg-background p-4 text-left text-sm">
            <span className="font-medium text-foreground first-letter:uppercase">
              {formatLongDate(done.date)}, {done.startTime}–{done.endTime}
            </span>
            <span>{done.serviceName}</span>
            <span>Con {done.professionalName}</span>
          </span>
          <span className="text-sm">
            Te hemos enviado los detalles a{" "}
            <strong className="text-foreground">{form.email.trim()}</strong>.{" "}
            {cancellationNote(booking.cancellation)}
          </span>
          <Button asChild variant="outline" className="h-11 rounded-full">
            <Link to={generatePath(paths.publicBookingManage, { slug, token: done.token })}>
              Ver mi cita
            </Link>
          </Button>
        </span>
      </Message>
    );
  }

  const service = booking.services.find((s) => s.id === serviceId);
  // With one professional there's nothing to choose
  const choosesProfessional = booking.professionals.length > 1;
  const canBook = booking.services.length > 0 && booking.professionals.length > 0;

  // Changing what's being booked changes the free times: choose them again
  const resetSlot = () => {
    setDate(null);
    setTime(null);
    create.reset();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!serviceId || !date || !time) return;
    create.mutate(
      {
        slug,
        serviceId,
        date,
        time,
        professionalId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        notes: form.notes.trim() || undefined,
        consent,
        website: form.website || undefined,
      },
      {
        // The time was taken meanwhile: the free times reload, choose another.
        // Any other problem (a detail the clinic doesn't accept) keeps the
        // form open so it can be corrected
        onError: (error) => {
          if ((error as { code?: string }).code === "SLOT_TAKEN") setTime(null);
        },
      },
    );
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 px-4 py-10 sm:py-14">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-coral">{booking.clinic.name}</span>
        <h1 className="font-display text-5xl leading-none tracking-tight sm:text-6xl">
          Reserva tu cita
        </h1>
        <p className="text-muted-foreground">Elige lo que necesitas y la hora que mejor te venga.</p>
      </header>

      {!canBook ? (
        <p className="rounded-[1.75rem] border border-dashed bg-card p-6 text-sm text-muted-foreground">
          Ahora mismo no hay citas disponibles para reservar online. Ponte en contacto con la
          clínica.
        </p>
      ) : (
        <>
          <Step number={1} title="¿Qué necesitas?">
            <div className="flex flex-col gap-2">
              {booking.services.map((s) => (
                <Choice
                  key={s.id}
                  selected={serviceId === s.id}
                  onSelect={() => {
                    setServiceId(s.id);
                    setWeekStart(booking.today);
                    resetSlot();
                  }}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{s.name}</span>
                    <span className="text-xs opacity-70">{formatDuration(s.durationMinutes)}</span>
                  </span>
                  {s.priceCents > 0 && (
                    <span className="shrink-0 tabular-nums">{formatPrice(s.priceCents)}</span>
                  )}
                </Choice>
              ))}
            </div>
          </Step>

          {choosesProfessional && service && (
            <Step number={2} title="¿Con quién?">
              <div className="grid gap-2 sm:grid-cols-2">
                <Choice
                  selected={professionalId === null}
                  onSelect={() => {
                    setProfessionalId(null);
                    resetSlot();
                  }}
                >
                  <span className="font-medium">Cualquiera disponible</span>
                </Choice>
                {booking.professionals.map((p) => (
                  <Choice
                    key={p.id}
                    selected={professionalId === p.id}
                    onSelect={() => {
                      setProfessionalId(p.id);
                      resetSlot();
                    }}
                  >
                    <span className="font-medium">{p.name}</span>
                  </Choice>
                ))}
              </div>
            </Step>
          )}

          {service && weekStart && (
            <Step number={choosesProfessional ? 3 : 2} title="¿Cuándo?">
              <SlotPicker
                slug={slug}
                serviceId={service.id}
                professionalId={professionalId}
                today={booking.today}
                lastDate={booking.lastDate}
                weekStart={weekStart}
                onWeekChange={setWeekStart}
                date={date}
                time={time}
                onSelect={(d, t) => {
                  setDate(d);
                  setTime(t);
                  create.reset();
                }}
              />
              {create.isError && !time && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  {create.error.message}
                </p>
              )}
            </Step>
          )}

          {service && date && time && (
            <Step number={choosesProfessional ? 4 : 3} title="Tus datos">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="booking-first-name">Nombre</Label>
                    <Input
                      id="booking-first-name"
                      required
                      maxLength={100}
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={(e) => set("firstName")(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="booking-last-name">Apellidos</Label>
                    <Input
                      id="booking-last-name"
                      required
                      maxLength={100}
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={(e) => set("lastName")(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="booking-phone">Teléfono</Label>
                    <Input
                      id="booking-phone"
                      type="tel"
                      required
                      minLength={6}
                      maxLength={30}
                      // Same rule as the backend
                      pattern="[\d\s+\(\).\-]{6,30}"
                      title="Solo números, espacios y los signos + ( ) . -"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => set("phone")(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="booking-email">Email</Label>
                    <Input
                      id="booking-email"
                      type="email"
                      required
                      maxLength={200}
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => set("email")(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="booking-notes">
                    Comentario <span className="font-normal text-muted-foreground">(opcional)</span>
                  </Label>
                  <Textarea
                    id="booking-notes"
                    rows={3}
                    maxLength={MAX_NOTES}
                    placeholder="Algo que la clínica deba saber antes de tu cita."
                    value={form.notes}
                    onChange={(e) => set("notes")(e.target.value)}
                  />
                </div>

                {/* Trap for bots: people never see or reach this field */}
                <div className="hidden" aria-hidden>
                  <label htmlFor="booking-website">Web</label>
                  <input
                    id="booking-website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => set("website")(e.target.value)}
                  />
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="booking-consent"
                    checked={consent}
                    onCheckedChange={(value) => setConsent(value === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="booking-consent" className="font-normal leading-snug">
                    Acepto que {booking.clinic.name} use estos datos para gestionar mi cita.{" "}
                    <Link
                      to={`${paths.privacy}#pacientes`}
                      target="_blank"
                      className="underline underline-offset-4"
                    >
                      Más información
                    </Link>
                  </Label>
                </div>

                <div className="flex flex-col gap-3 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{service.name}</span> ·{" "}
                    {formatLongDate(date)} a las {time}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cancellationNote(booking.cancellation)}
                  </p>
                  {booking.cancellation.policyText && (
                    <p className="text-xs whitespace-pre-line text-muted-foreground">
                      {booking.cancellation.policyText}
                    </p>
                  )}
                  {create.isError && (
                    <p role="alert" className="text-sm text-destructive">
                      {create.error.message}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="h-11 rounded-full"
                    disabled={!consent || create.isPending}
                  >
                    {create.isPending && <Loader2 className="animate-spin" />}
                    Confirmar reserva
                  </Button>
                </div>
              </form>
            </Step>
          )}
        </>
      )}
    </div>
  );
}
