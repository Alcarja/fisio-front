// Treatment types and their colour in the calendar
export const treatments = {
  physio: { label: "Fisioterapia", className: "bg-sage" },
  massage: { label: "Masaje", className: "bg-sand" },
  rehab: { label: "Rehabilitación", className: "bg-sky" },
  pilates: { label: "Pilates", className: "bg-lilac" },
} as const;

export type Treatment = keyof typeof treatments;
