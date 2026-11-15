import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  children: ReactNode;
};

// One block of the account page: icon, title and what it's for, then its content
export default function AccountSection({ icon: Icon, title, description, children }: Props) {
  return (
    <section className="grid grid-cols-1 gap-5 rounded-[1.75rem] border bg-card p-5 sm:p-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
      <header className="flex items-start gap-3 lg:flex-col">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary">
          <Icon className="size-4 text-primary" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
