import { generatePath, Link } from "react-router";
import { useMe } from "@/adapters/hook";
import { hasAccess, patientsAccess } from "@/lib/roles";
import { paths } from "@/routes/paths";
import { patientName } from "../calendarUtils";

type Props = {
  patient: { patientId: string | null; firstName: string; lastName: string };
};

// A patient's name, linked to their ficha when they have one and the clinic
// has the Pacientes section
export default function PatientNameLink({ patient }: Props) {
  const { data: me } = useMe();
  if (!patient.patientId || !hasAccess(me, patientsAccess)) return <>{patientName(patient)}</>;
  return (
    <Link
      to={generatePath(paths.adminPatient, { patientId: patient.patientId })}
      className="underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:decoration-foreground"
    >
      {patientName(patient)}
    </Link>
  );
}
