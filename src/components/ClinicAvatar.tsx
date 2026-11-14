import { cn } from "@/lib/utils";

// Soft brand colors; each clinic always gets the same one
const palette = [
  "bg-sage text-primary",
  "bg-sky text-primary",
  "bg-sand text-primary",
];

function colorFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

// "Clínica Sol Centro" -> "SC" (skips generic words so clinics are told apart)
function initials(name: string) {
  const generic = new Set(["clinica", "clínica", "centro", "de", "del", "la", "el", "y"]);
  const words = name.split(/\s+/).filter(Boolean);
  const meaningful = words.filter((w) => !generic.has(w.toLowerCase()));
  const source = meaningful.length > 0 ? meaningful : words;
  return source
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

type Props = {
  clinicId: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function ClinicAvatar({ clinicId, name, size = "md", className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center font-medium",
        size === "sm" && "size-7 rounded-lg text-[11px]",
        size === "md" && "size-10 rounded-xl text-sm",
        size === "lg" && "size-11 rounded-xl text-sm",
        colorFor(clinicId),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
