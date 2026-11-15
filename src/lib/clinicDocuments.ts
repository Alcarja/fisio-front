import type { ClinicDocumentType, ClinicFeature, ClinicLegal } from "@/adapters/api";

// What Kineflow needs from each clinic, as shown in Plataforma → Clínicas → a
// clinic → Documentación. Keys mirror back/src/lib/clinicDocuments.ts

// The signed documents, in the order shown.
// requiredWith: only needed while the clinic has that feature switched on
export const clinicDocumentTypes: {
  key: ClinicDocumentType;
  label: string;
  description: string;
  required: boolean;
  requiredWith?: ClinicFeature;
}[] = [
  {
    key: "service_contract",
    label: "Contrato de servicio",
    description: "Las condiciones del servicio y el precio, firmadas por la clínica.",
    required: true,
  },
  {
    key: "dpa",
    label: "Encargo del tratamiento",
    description:
      "Contrato del art. 28 RGPD: la clínica es responsable de los datos de sus pacientes y Kineflow los trata por su cuenta.",
    required: true,
  },
  {
    key: "health_annex",
    label: "Anexo de datos de salud",
    description:
      "Amplía el encargo a la historia clínica (antecedentes, expedientes y notas). Solo hace falta con la funcionalidad Pacientes e historia clínica.",
    required: false,
    requiredWith: "clinical_history",
  },
  {
    key: "other",
    label: "Otros documentos",
    description: "Cualquier otro papel de la clínica: anexos, cambios de titular, bajas…",
    required: false,
  },
];

// Legal details that must be filled in before the contracts can be written
export const requiredLegalFields: { key: keyof ClinicLegal; label: string }[] = [
  { key: "legalName", label: "titular" },
  { key: "taxId", label: "NIF" },
  { key: "address", label: "domicilio" },
  { key: "signerName", label: "firmante" },
  { key: "privacyContactEmail", label: "email de protección de datos" },
];

// "1,2 MB", "340 kB"
export const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} kB`;

export const DOCUMENT_ACCEPT = "application/pdf,image/jpeg,image/png";
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
