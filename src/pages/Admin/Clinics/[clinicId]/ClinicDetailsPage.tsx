import { Link, useParams } from "react-router";
import { ArrowLeft, Building2, CircleAlert, Loader2 } from "lucide-react";
import { useGetClinicById } from "@/adapters/hook";
import { Badge } from "@/components/ui/badge";
import { paths } from "@/routes/paths";
import ClinicContract from "./components/ClinicContract";
import ClinicDetailsForm from "./components/ClinicDetailsForm";
import ClinicDocumentation from "./components/ClinicDocumentation";
import ClinicFeatures from "./components/ClinicFeatures";
import ClinicMembers from "./components/ClinicMembers";

// Superadmin only: everything about one clinic
export default function ClinicDetailsPage() {
  const { clinicId } = useParams<{ clinicId: string }>();

  const { data: clinic, isPending, error } = useGetClinicById(clinicId);

  return (
    <div className="flex flex-col gap-8">
      <Link
        to={paths.adminClinics}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Clínicas
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
            <div className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary sm:size-16">
                {clinic.logo ? (
                  <img
                    src={clinic.logo}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <Building2 className="size-6 text-primary" />
                )}
              </span>
              <div className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-medium text-coral">Clínica</span>
                <h1 className="font-display text-4xl leading-none tracking-tight text-balance break-words sm:text-5xl md:text-6xl">
                  {clinic.name}
                </h1>
                <p className="text-muted-foreground">/{clinic.slug}</p>
              </div>
            </div>
            <Badge
              variant={clinic.status === "active" ? "secondary" : "outline"}
              className="w-fit"
            >
              {clinic.status ?? "—"}
            </Badge>
          </header>

          {/* key: start the form fresh when switching clinics */}
          <ClinicDetailsForm key={clinic.id} clinic={clinic} />
          <ClinicContract clinicId={clinic.id} />
          <ClinicFeatures clinicId={clinic.id} enabled={clinic.features} />
          <ClinicDocumentation clinicId={clinic.id} features={clinic.features} />
          {/* key changes when someone joins or leaves, so the role draft restarts */}
          <ClinicMembers
            key={`members-${clinic.id}-${clinic.members.map((m) => m.memberId).join()}`}
            clinicId={clinic.id}
            members={clinic.members}
            invitations={clinic.invitations}
          />
        </>
      )}
    </div>
  );
}
