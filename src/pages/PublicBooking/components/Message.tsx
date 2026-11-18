import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  // Inside a clinic's website (useEmbed): no full-screen height or outer
  // spacing, so the frame can shrink to the card
  embed?: boolean;
};

// A full-screen card with one message: clinic not available, booking done,
// the patient's own appointment
export default function Message({ icon, title, children, embed = false }: Props) {
  return (
    <div
      className={
        embed
          ? "flex items-center justify-center p-1"
          : "flex min-h-svh items-center justify-center px-4 py-10"
      }
    >
      <div
        className="flex w-full max-w-md flex-col items-center gap-4 rounded-[2rem] border bg-card p-8 text-center"
        aria-live="polite"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
          {icon}
        </span>
        <h1 className="font-display text-4xl leading-none tracking-tight">{title}</h1>
        <div className="flex w-full flex-col gap-4 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
