import type { PaymentMethod } from "@/adapters/api";
import { cn } from "@/lib/utils";
import { methodLabels, methodOrder } from "../chargesUtils";

// How it was paid: one pill per method
export default function MethodPicker({
  value,
  onChange,
  disabled,
  label = "Forma de pago",
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {methodOrder.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={value === m}
          onClick={() => onChange(m)}
          disabled={disabled}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
            value === m ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
          )}
        >
          {methodLabels[m]}
        </button>
      ))}
    </div>
  );
}
