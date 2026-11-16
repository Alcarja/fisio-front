import { CircleAlert, Loader2 } from "lucide-react";
import { useMe, useOnlineBooking } from "@/adapters/hook";
import BookingLinkSection from "./components/BookingLinkSection";
import BookingRulesSection from "./components/BookingRulesSection";
import BookingSwitchSection from "./components/BookingSwitchSection";
import ProfessionalsSection from "./components/ProfessionalsSection";

// Configuración → Reserva online: the clinic's own switch and when each
// professional accepts online bookings. Only in clinics where a superadmin
// switched the "online_booking" feature on (router: onlineBookingAccess).
// Backend: /clinic/settings/online-booking (back/src/routes/online-booking.routes.ts)
export default function OnlineBookingPage() {
  const { data: me } = useMe();
  const { data, isPending, error } = useOnlineBooking(me?.activeClinic?.clinicId);

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      >
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BookingSwitchSection enabled={data.enabled} />
      {me?.activeClinic && (
        <BookingLinkSection
          slug={me.activeClinic.clinicSlug}
          clinicName={me.activeClinic.clinicName}
          bookingEnabled={data.enabled}
        />
      )}
      {/* key: start the form again from the saved data after each save */}
      <BookingRulesSection key={JSON.stringify(data.rules)} rules={data.rules} />
      <ProfessionalsSection
        professionals={data.professionals}
        clinicHours={data.clinicHours}
        bookingEnabled={data.enabled}
      />
    </div>
  );
}
