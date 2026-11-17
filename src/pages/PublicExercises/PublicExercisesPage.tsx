import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router";
import { CircleAlert, Loader2, Printer, Repeat, Timer, TriangleAlert } from "lucide-react";
import { publicExercisesPath } from "@/adapters/api";
import { usePublicProgram } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/utils/stp-api";
import { doseText } from "../Admin/Exercises/exerciseFormat";

// Public (no login): a patient's exercises for home, from the link or QR their
// physio gave them. Only the exercises: never their name or diagnosis.
// Also the printed sheet (?imprimir=1 opens the print dialog)
export default function PublicExercisesPage() {
  const { token } = useParams<{ token: string }>();
  const [params] = useSearchParams();
  const { data: program, isPending, error } = usePublicProgram(token);
  const printNow = params.get("imprimir") === "1";

  useEffect(() => {
    // Search engines must never keep this page
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (!program || !printNow) return;
    // Give the images a moment to load
    const timer = setTimeout(() => window.print(), 800);
    return () => clearTimeout(timer);
  }, [program, printNow]);

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !program) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-3 px-5 text-center">
        <CircleAlert className="size-6 text-muted-foreground" />
        <p className="text-muted-foreground">
          {error?.message ?? "Este enlace ya no está activo. Pide a tu fisio uno nuevo."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-8 px-4 py-10 print:max-w-none print:gap-5 print:py-0">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-coral">{program.clinicName}</span>
        <h1 className="font-display text-5xl leading-none tracking-tight print:text-4xl">Tus ejercicios</h1>
        <p className="text-muted-foreground">
          {program.physioName ? `Pautados por ${program.physioName}` : "Pautados por tu fisio"}
          {program.frequency && ` · ${program.frequency}`}
        </p>
        {program.notes && (
          <p className="mt-2 rounded-2xl bg-secondary px-4 py-3 text-sm whitespace-pre-wrap">{program.notes}</p>
        )}
        <Button variant="outline" className="mt-2 w-fit rounded-full print:hidden" onClick={() => window.print()}>
          <Printer /> Imprimir
        </Button>
      </header>

      <ol className="flex flex-col gap-4">
        {program.items.map((item, index) => (
          <li key={item.id} className="flex break-inside-avoid flex-col gap-4 rounded-[1.75rem] border bg-card p-5 print:rounded-xl print:p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground tabular-nums">
                {index + 1}
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg leading-tight font-medium">{item.name}</h2>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {(item.sets || item.reps) && (
                    <span className="flex items-center gap-1">
                      <Repeat className="size-3.5" /> {doseText({ ...item, restSeconds: null }, false)}
                    </span>
                  )}
                  {!item.reps && item.seconds && !item.sets && (
                    <span className="flex items-center gap-1">
                      <Timer className="size-3.5" /> {item.seconds} s
                    </span>
                  )}
                  {item.restSeconds ? <span>Descanso {item.restSeconds} s</span> : null}
                </span>
              </div>
            </div>

            {item.hasImage && item.imageVersion && (
              <img
                src={`${API_URL}${publicExercisesPath(token!)}/items/${item.id}/image?v=${encodeURIComponent(item.imageVersion)}`}
                alt={item.name}
                loading="lazy"
                className="max-h-72 w-full rounded-2xl bg-muted object-contain print:max-h-48"
              />
            )}

            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm">
              {item.instructions
                .split("\n")
                .filter(Boolean)
                .map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
            </ol>

            {item.notes && (
              <p className="rounded-xl bg-secondary px-3 py-2 text-sm">
                <strong className="font-medium">Para ti:</strong> {item.notes}
              </p>
            )}
            {item.precautions && (
              <p className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {item.precautions}
              </p>
            )}
          </li>
        ))}
      </ol>

      <footer className="flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground">
        <p>
          Si un ejercicio te causa un dolor intenso o que va a más, para y coméntalo con tu fisio. Estos ejercicios
          son solo para ti: no los compartas.
        </p>
        <p className="print:hidden">Enviado con Kineflow</p>
      </footer>
    </div>
  );
}
