import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, CalendarDays, CircleAlert, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { PatientAppointment, PatientDetails } from "@/adapters/api";
import { useDeletePatient, useMe, usePatient } from "@/adapters/hook";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clinicalAccess, hasAccess, teamAccess } from "@/lib/roles";
import { paths } from "@/routes/paths";
import { statusLabels } from "../../Bookings/calendarUtils";
import ClinicalRecord from "../components/ClinicalRecord";
import PatientDialog from "../components/PatientDialog";

// "2026-11-16" -> local Date (to format it)
const toDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};

const dayFormat = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const birthFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "long" });
const createdFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" });

// Full years since the birth date
function ageOf(birthDate: string) {
  const birth = toDate(birthDate);
  const now = new Date();
  const hadBirthday =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  return now.getFullYear() - birth.getFullYear() - (hadBirthday ? 0 : 1);
}

// Every clinic role: one patient's ficha. Top to bottom: the clinical history
// (alert, expedientes, antecedentes; not for receptionists), personal data and
// appointments. Deleting it is for owners and admins (the backend checks it too)
export default function PatientDetailsPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: patient, isPending, error } = usePatient(me?.activeClinic?.clinicId, patientId);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const remove = useDeletePatient();
  const canDelete = hasAccess(me, teamAccess);
  // Historia clínica: physios, owners and admins. Receptionists see the rest
  const canSeeClinical = hasAccess(me, clinicalAccess);

  const deleteIt = () =>
    remove.mutate(patientId!, {
      onSuccess: () => {
        toast.success("Ficha eliminada");
        navigate(paths.adminPatients, { replace: true });
      },
      onError: (error) => {
        toast.error("No se pudo eliminar la ficha", { description: error.message });
        setConfirmDelete(false);
      },
    });

  return (
    <div className="flex flex-col gap-8">
      <Link
        to={paths.adminPatients}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Pacientes
      </Link>

      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error.message}
        </div>
      ) : (
        <>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-sm font-medium text-coral">Paciente</span>
              <h1 className="font-display text-4xl leading-none tracking-tight text-balance break-words sm:text-5xl md:text-6xl">
                {patient.firstName} {patient.lastName}
              </h1>
              <p className="text-muted-foreground">
                Ficha creada el {createdFormat.format(new Date(patient.createdAt))}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => setEditing(true)}>
                <Pencil /> Editar
              </Button>
              {canDelete && (
                <Button
                  variant="outline"
                  className="rounded-full text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 /> Eliminar
                </Button>
              )}
            </div>
          </header>

          {/* Clinical first: it's what a physio opens the ficha for */}
          {canSeeClinical && <ClinicalRecord patientId={patient.id} />}

          <Section title="Datos personales" description="Contacto y datos para las facturas.">
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Data label="Teléfono">
                {patient.phone && (
                  <a href={`tel:${patient.phone.replace(/\s/g, "")}`} className="hover:underline">
                    {patient.phone}
                  </a>
                )}
              </Data>
              <Data label="Email">
                {patient.email && (
                  <a href={`mailto:${patient.email}`} className="break-all hover:underline">
                    {patient.email}
                  </a>
                )}
              </Data>
              <Data label="NIF / NIE">{patient.nif}</Data>
              <Data label="Nacimiento">
                {patient.birthDate &&
                  `${birthFormat.format(toDate(patient.birthDate))} (${ageOf(patient.birthDate)} años)`}
              </Data>
              <Data label="Dirección" wide>
                {[patient.address, [patient.postalCode, patient.city].filter(Boolean).join(" ")]
                  .filter(Boolean)
                  .join(", ")}
              </Data>
              <Data label="Notas internas" wide>
                {patient.notes && <span className="whitespace-pre-wrap">{patient.notes}</span>}
              </Data>
            </dl>
          </Section>

          <Appointments patient={patient} />

          {editing && <PatientDialog patient={patient} onClose={() => setEditing(false)} />}
          <ConfirmDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            title="¿Eliminar esta ficha?"
            description={
              <>
                Se borrarán los datos de{" "}
                <strong className="font-medium">
                  {patient.firstName} {patient.lastName}
                </strong>
                . Sus citas seguirán en el calendario con su nombre, pero sin ficha. No se puede
                deshacer. Si tiene expedientes clínicos, la ficha no se puede eliminar.
              </>
            }
            confirmLabel="Eliminar ficha"
            onConfirm={deleteIt}
            pending={remove.isPending}
          />
        </>
      )}
    </div>
  );
}

// Upcoming appointments first (soonest on top), then the past ones (newest on top)
function Appointments({ patient }: { patient: PatientDetails }) {
  const upcoming = patient.appointments
    .filter((a) => !a.isPast && a.status !== "cancelled")
    .reverse();
  const rest = patient.appointments.filter((a) => a.isPast || a.status === "cancelled");
  const attended = rest.filter((a) => a.status === "completed").length;

  return (
    <Section
      title="Citas"
      description={
        patient.appointments.length === 0
          ? "Sin citas todavía."
          : `${upcoming.length} ${upcoming.length === 1 ? "próxima" : "próximas"} · ${attended} ${attended === 1 ? "realizada" : "realizadas"}`
      }
    >
      {patient.appointments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          <CalendarDays className="size-5" />
          <span>
            Este paciente no tiene citas. Se dan desde{" "}
            <Link to={paths.adminBookings} className="underline underline-offset-4">
              Reservas
            </Link>
            .
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {upcoming.length > 0 && <AppointmentList title="Próximas" appointments={upcoming} />}
          {rest.length > 0 && <AppointmentList title="Anteriores" appointments={rest} />}
        </div>
      )}
    </Section>
  );
}

function AppointmentList({
  title,
  appointments,
}: {
  title: string;
  appointments: PatientAppointment[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <ul className="flex flex-col divide-y">
        {appointments.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: a.serviceColor }}
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium first-letter:uppercase">
                {dayFormat.format(toDate(a.date))} · {a.startTime} – {a.endTime}
              </span>
              <span className="truncate text-sm text-muted-foreground">
                {a.serviceName} · {a.physioName}
              </span>
            </div>
            <Badge
              variant={a.status === "cancelled" || a.status === "no_show" ? "outline" : "secondary"}
            >
              {statusLabels[a.status]}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Card with a title on the left and content on the right (stacked on phones)
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 rounded-[1.75rem] border bg-card p-6 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

// One piece of data; "—" while it's empty
function Data({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-sm font-medium">{label}</dt>
      <dd className="text-sm text-muted-foreground">{children || "—"}</dd>
    </div>
  );
}
