import { useState } from "react";
import { generatePath, Link, useParams } from "react-router";
import { CalendarCheck, CalendarX, Loader2 } from "lucide-react";
import type { PatientBooking } from "@/adapters/api";
import { useCancelPatientBooking, usePatientBooking } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { paths } from "@/routes/paths";
import { formatLongDate, hoursLabel } from "./bookingFormat";
import Message from "./components/Message";
import { useEmbed } from "./useEmbed";

// Why the cancel button isn't there
const blockedText = (booking: PatientBooking) => {
  switch (booking.cancelBlocked) {
    case "TOO_LATE":
      return `Ya no se puede cancelar online: el plazo termina ${hoursLabel(booking.cancellation.cancelNoticeHours)} antes de la cita. Si no puedes venir, llama a la clínica.`;
    case "NOT_ALLOWED":
      return "Si no puedes venir, avisa a la clínica lo antes posible.";
    case "FINISHED":
      return "Esta cita ya ha pasado.";
    default:
      return null;
  }
};

// Public page of one online booking (/reservar/:slug/cita/:token): the patient
// opens it from their confirmation email to see the appointment or cancel it,
// inside the clinic's cancellation criteria
export default function ManageBookingPage() {
  const { slug, token } = useParams();
  const { data: booking, isPending, error } = usePatientBooking({ slug, token });
  const cancel = useCancelPatientBooking();
  const [confirming, setConfirming] = useState(false);
  // Normally opened from the confirmation email, full page; embed mode only
  // in case it ends up inside a clinic's website (see useEmbed)
  const embed = useEmbed();

  if (isPending) {
    return (
      <div className={`flex items-center justify-center ${embed ? "py-16" : "min-h-svh"}`}>
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !slug || !token) {
    return (
      <Message
        embed={embed}
        icon={<CalendarX className="size-5 text-primary" />}
        title="Cita no encontrada"
      >
        <p>No encontramos esta cita. Revisa el enlace de tu email o llama a la clínica.</p>
      </Message>
    );
  }

  const details = (
    <div className="flex flex-col gap-1 rounded-2xl border bg-background p-4 text-left text-sm">
      <span className="font-medium text-foreground first-letter:uppercase">
        {formatLongDate(booking.date)}, {booking.startTime}–{booking.endTime}
      </span>
      <span>{booking.serviceName}</span>
      <span>Con {booking.professionalName}</span>
    </div>
  );
  const bookAgain = (
    <Button asChild variant="outline" className="h-11 rounded-full">
      {/* Embedded, stay in embed mode inside the frame */}
      <Link to={generatePath(paths.publicBooking, { slug }) + (embed ? "?embed=1" : "")}>
        Reservar otra cita
      </Link>
    </Button>
  );

  if (booking.cancelled) {
    return (
      <Message
        embed={embed}
        icon={<CalendarX className="size-5 text-primary" />}
        title="Cita cancelada"
      >
        <p>
          Tu cita en <strong className="text-foreground">{booking.clinicName}</strong> está
          cancelada.
        </p>
        <div className="line-through opacity-70">{details}</div>
        {bookAgain}
      </Message>
    );
  }

  const blocked = blockedText(booking);

  return (
    <Message
      embed={embed}
      icon={<CalendarCheck className="size-5 text-primary" />}
      title="Tu cita"
    >
      <p>
        Te esperamos en <strong className="text-foreground">{booking.clinicName}</strong>.
      </p>
      {details}
      {booking.cancellation.policyText && (
        <p className="text-left text-sm whitespace-pre-line">{booking.cancellation.policyText}</p>
      )}

      {cancel.isError && (
        <p role="alert" className="text-sm text-destructive">
          {cancel.error.message}
        </p>
      )}

      {!booking.canCancel ? (
        blocked && <p className="text-sm">{blocked}</p>
      ) : confirming ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm">¿Seguro que quieres cancelar esta cita?</p>
          <Button
            type="button"
            variant="destructive"
            className="h-11 rounded-full"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate({ slug, token }, { onSettled: () => setConfirming(false) })}
          >
            {cancel.isPending && <Loader2 className="animate-spin" />}
            Sí, cancelar la cita
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-full"
            disabled={cancel.isPending}
            onClick={() => setConfirming(false)}
          >
            No, la mantengo
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full"
            onClick={() => setConfirming(true)}
          >
            Cancelar la cita
          </Button>
          {booking.cancellation.cancelNoticeHours > 0 && (
            <p className="text-xs">
              Puedes cancelar online hasta {hoursLabel(booking.cancellation.cancelNoticeHours)}{" "}
              antes de la cita.
            </p>
          )}
        </div>
      )}
    </Message>
  );
}
