import { Loader2 } from "lucide-react";
import { usePublicClassSessions } from "@/adapters/hook";
import type { PublicClassSession } from "@/adapters/api";
import { formatLongDate } from "../bookingFormat";
import Choice from "./Choice";

type Props = {
  slug: string;
  serviceId: string;
  sessionId: string | null;
  onSelect: (session: PublicClassSession) => void;
};

// Few places left: say how many, so people know to hurry
const FEW_PLACES = 3;

// The upcoming sessions of a group class, by day. Full ones show but can't be
// picked
export default function ClassSessionPicker({ slug, serviceId, sessionId, onSelect }: Props) {
  const { data: sessions, isPending, isError } = usePublicClassSessions(slug, serviceId);

  if (isPending) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError) {
    return <p className="text-sm text-destructive">No se han podido cargar las sesiones.</p>;
  }
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No quedan sesiones de esta clase para reservar online.
      </p>
    );
  }

  // Sessions come in date order
  const days = new Map<string, PublicClassSession[]>();
  for (const s of sessions) days.set(s.date, [...(days.get(s.date) ?? []), s]);
  return (
    <div className="flex flex-col gap-4">
      {[...days].map(([date, daySessions]) => (
        <div key={date} className="flex flex-col gap-2">
          <span className="text-sm font-medium first-letter:uppercase">{formatLongDate(date)}</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {daySessions.map((s) => {
              const full = s.placesLeft <= 0;
              return (
                <Choice
                  key={s.id}
                  selected={sessionId === s.id}
                  disabled={full}
                  onSelect={() => onSelect(s)}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium tabular-nums">
                      {s.startTime}–{s.endTime}
                    </span>
                    {s.professionalName && (
                      <span className="truncate text-xs opacity-70">Con {s.professionalName}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs opacity-70">
                    {full
                      ? "Completa"
                      : s.placesLeft <= FEW_PLACES
                        ? `${s.placesLeft} ${s.placesLeft === 1 ? "plaza" : "plazas"}`
                        : null}
                  </span>
                </Choice>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
