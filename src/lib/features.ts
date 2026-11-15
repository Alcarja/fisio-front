import type { ClinicFeature } from "@/adapters/api";

// Optional features a superadmin switches on per clinic, as shown in
// Plataforma → Clínicas → a clinic. Keys mirror back/src/lib/features.ts.
//
// To add one: 1) add its key in the backend and to ClinicFeature in api.ts,
// 2) describe it here, 3) protect its pages with `feature` in their AccessRule
// (lib/roles.ts) and its endpoints with requireFeature in the backend
export const clinicFeatures: {
  key: ClinicFeature;
  label: string;
  description: string;
}[] = [
  {
    key: "invoicing",
    label: "Facturación",
    description: "La clínica puede generar facturas para sus pacientes desde la plataforma.",
  },
  {
    key: "clinical_history",
    label: "Pacientes e historia clínica",
    description:
      "La sección Pacientes: fichas con sus datos, expedientes y notas de evolución, y enlazar las citas a cada ficha. Sin ella, en las citas solo se escribe nombre y apellidos. Incluye datos de salud: actívala cuando la clínica tenga firmados el encargo del tratamiento y el anexo de datos de salud.",
  },
];
