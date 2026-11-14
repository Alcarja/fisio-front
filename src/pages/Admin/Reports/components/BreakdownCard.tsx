import type { ReactNode } from "react";
import { formatHours, formatPercent, share, type Totals } from "../reportUtils";

export type BreakdownItem = {
  id: string;
  name: string;
  marker: ReactNode; // what identifies it: the service color, the physio's avatar
  totals: Totals;
  extra?: string; // one more detail for the second line
};

type Props = {
  title: string;
  description: string;
  items: BreakdownItem[]; // already sorted, most appointments first
  total: number; // appointments of the month, for the percentages
};

// Ranked list: name, number of appointments and a thin bar to compare at a glance.
// The bar is one color for every row (it shows how many, not who); identity is
// the marker next to the name. Every number is written out, the bar only helps
export default function BreakdownCard({ title, description, items, total }: Props) {
  const max = Math.max(1, ...items.map((i) => i.totals.appointments));

  return (
    <section className="flex flex-col gap-5 rounded-[1.75rem] border bg-card p-5 sm:p-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nada que mostrar todavía.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item) => {
            const { appointments, minutes, noShows } = item.totals;
            const details = [
              formatHours(minutes),
              item.extra,
              noShows > 0 && `${noShows} ausencia${noShows === 1 ? "" : "s"}`,
            ].filter(Boolean);

            return (
              <li
                key={item.id}
                className="flex items-center gap-3"
                title={`${item.name}: ${appointments} citas (${formatPercent(share(appointments, total))})`}
              >
                {item.marker}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium">{item.name}</span>
                    <span className="shrink-0 text-sm tabular-nums">
                      <span className="font-medium">{appointments}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {formatPercent(share(appointments, total))}
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${(appointments / max) * 100}%` }}
                    />
                  </div>
                  <span className="truncate text-xs text-muted-foreground">
                    {appointments === 0 ? "Sin citas este mes" : details.join(" · ")}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
