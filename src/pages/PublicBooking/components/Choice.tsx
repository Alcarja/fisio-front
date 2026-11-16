import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

// A big option the patient picks (a service, a professional, a day, a time)
export default function Choice({ selected, onSelect, disabled, className, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "rounded-xl border px-4 py-3 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background hover:border-primary/50",
        className,
      )}
    >
      {children}
    </button>
  );
}
