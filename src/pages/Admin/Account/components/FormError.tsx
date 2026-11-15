import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

// Red box under a form, same look as the login and reset password pages
export default function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {children}
    </div>
  );
}
