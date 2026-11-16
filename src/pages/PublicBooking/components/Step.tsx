import type { ReactNode } from "react";

type Props = {
  number: number;
  title: string;
  children: ReactNode;
};

// One numbered step of the booking page
export default function Step({ number, title, children }: Props) {
  return (
    <section className="flex flex-col gap-4 rounded-[1.75rem] border bg-card p-5 sm:p-6">
      <h2 className="flex items-center gap-3 font-medium">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm tabular-nums">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
