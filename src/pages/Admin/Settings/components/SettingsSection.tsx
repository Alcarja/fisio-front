import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  // Optional button next to the title (e.g. "Añadir")
  action?: ReactNode;
  children: ReactNode;
};

// Card used by every settings section: title on the left, content on the
// right (stacked on phones). Same look as the rest of the panel
export default function SettingsSection({ title, description, action, children }: Props) {
  return (
    <section className="grid gap-6 rounded-[1.75rem] border bg-card p-6 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex flex-col items-start gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
