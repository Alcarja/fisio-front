import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  // What this section will contain, as a short list
  items: string[];
  children?: ReactNode;
};

// Temporary content for a settings section that isn't built yet
export default function SectionPlaceholder({ icon: Icon, title, description, items }: Props) {
  return (
    <section className="grid gap-6 rounded-[1.75rem] border border-dashed bg-card p-6 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex flex-col gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-secondary">
          <Icon className="size-4 text-primary" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 font-medium">
            {title}
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
              Pronto
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
