// Historia clínica: labels and small helpers. Keys mirror back/src/lib/clinical.ts
import type {
  BodyRegion,
  CaseSide,
  ClinicalBackground,
  CloseOutcome,
  PatientCase,
} from "@/adapters/api";

// In the order they're offered: head to feet, "general" last
export const bodyRegionLabels: Record<BodyRegion, string> = {
  head_jaw: "Cabeza y mandíbula",
  neck: "Cervical",
  shoulder: "Hombro",
  elbow: "Codo",
  wrist_hand: "Muñeca y mano",
  thoracic: "Dorsal",
  lumbar: "Lumbar",
  hip_pelvis: "Cadera y pelvis",
  knee: "Rodilla",
  ankle_foot: "Tobillo y pie",
  general: "General / otra",
};

export const sideLabels: Record<CaseSide, string> = {
  left: "Izquierdo",
  right: "Derecho",
  both: "Ambos lados",
};

export const closeOutcomeLabels: Record<CloseOutcome, string> = {
  resolved: "Resuelto",
  improved: "Mejoría",
  no_change: "Sin cambios",
  referred: "Derivado a otro profesional",
  dropped: "Abandono del tratamiento",
};

// "Hombro · derecho"
export const regionAndSide = (c: Pick<PatientCase, "bodyRegion" | "side">) =>
  c.side && c.side !== "both"
    ? `${bodyRegionLabels[c.bodyRegion]} · ${sideLabels[c.side].toLowerCase()}`
    : c.side === "both"
      ? `${bodyRegionLabels[c.bodyRegion]} · ambos lados`
      : bodyRegionLabels[c.bodyRegion];

// "2026-11-16" -> local Date (to format it)
export const toDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};

const dateFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });
// "2026-11-16" -> "16 nov 2026"
export const formatDate = (iso: string) => dateFormat.format(toDate(iso)).replace(".", "");

// Today as "2026-11-16" (local)
export const todayIso = () => new Date().toLocaleDateString("sv-SE");

// Pain (EVA 0-10) colours: mild, moderate, severe
export const painClass = (level: number) =>
  level <= 3
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    : level <= 6
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
      : "bg-red-500/15 text-red-700 dark:text-red-400";

// Pain in the first and the latest note that recorded it (notes come newest
// first). null if no note has it
export function painTrend(notes: { painLevel: number | null }[]) {
  const levels = notes.flatMap((n) => (n.painLevel === null ? [] : [n.painLevel]));
  if (levels.length === 0) return null;
  return { first: levels.at(-1)!, latest: levels[0]!, changed: levels.length > 1 };
}

// Antecedentes: the fields, in the order shown. `long`: several lines
export const backgroundFields: {
  key: keyof ClinicalBackground;
  label: string;
  placeholder: string;
  maxLength: number;
  long?: boolean;
}[] = [
  {
    key: "clinicalAlert",
    label: "Aviso clínico",
    placeholder: "Lo que hay que saber antes de tratar: marcapasos, anticoagulantes…",
    maxLength: 300,
  },
  { key: "allergies", label: "Alergias", placeholder: "Látex, cremas…", maxLength: 1000 },
  { key: "medication", label: "Medicación habitual", placeholder: "", maxLength: 1000 },
  {
    key: "medicalHistory",
    label: "Antecedentes",
    placeholder: "Enfermedades, operaciones y lesiones anteriores",
    maxLength: 4000,
    long: true,
  },
  {
    key: "occupation",
    label: "Profesión y actividad física",
    placeholder: "Administrativa, corre 3 días por semana",
    maxLength: 300,
  },
];
