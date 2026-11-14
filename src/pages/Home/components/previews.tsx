import { Check, Clock, Flame, MessageCircle, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { treatments, type Treatment } from "./treatments";

// Small, static product mock-ups used in the "How it works" tour

const week: { day: string; blocks: { top: number; h: number; type: Treatment }[] }[] = [
  { day: "Lun", blocks: [{ top: 4, h: 18, type: "physio" }, { top: 30, h: 14, type: "rehab" }, { top: 60, h: 20, type: "massage" }] },
  { day: "Mar", blocks: [{ top: 10, h: 22, type: "pilates" }, { top: 40, h: 16, type: "physio" }, { top: 70, h: 14, type: "rehab" }] },
  { day: "Mié", blocks: [{ top: 2, h: 14, type: "rehab" }, { top: 22, h: 20, type: "physio" }, { top: 56, h: 26, type: "physio" }] },
  { day: "Jue", blocks: [{ top: 16, h: 18, type: "massage" }, { top: 44, h: 22, type: "pilates" }] },
  { day: "Vie", blocks: [{ top: 6, h: 16, type: "physio" }, { top: 28, h: 14, type: "rehab" }, { top: 50, h: 18, type: "physio" }] },
];

export function SchedulePreview() {
  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Laura · esta semana</span>
        <span className="text-xs text-muted-foreground">32 h reservadas</span>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {week.map((d, col) => (
          <div key={d.day} className="flex flex-col gap-2">
            <span className="text-center text-[11px] text-muted-foreground">{d.day}</span>
            <div className="relative h-56 rounded-lg bg-muted/60">
              {d.blocks.map((b, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute inset-x-1 rounded-md motion-safe:animate-rise",
                    treatments[b.type].className,
                  )}
                  style={{
                    top: `${b.top}%`,
                    height: `${b.h}%`,
                    animationDelay: `${col * 60 + i * 40}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed p-3 text-xs">
        <span className="size-2 rounded-full bg-coral" />
        Arrastra para cambiar la cita. El paciente recibe el aviso automáticamente.
      </div>
    </div>
  );
}

const pain = [8, 7, 7, 5, 4, 3];

export function RecordPreview() {
  // Higher pain sits higher on the chart
  const points = pain.map(
    (p, i) => [(i / (pain.length - 1)) * 260, 8 + (1 - p / 10) * 90] as const,
  );
  const path = points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-sand font-display text-xl">
          LF
        </span>
        <div className="flex flex-col">
          <span className="font-medium">Lucía Fernández</span>
          <span className="text-xs text-muted-foreground">Lumbalgia · Sesión 6 de 10</span>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-muted/60 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Dolor (0–10)</span>
          <span className="font-medium text-primary">8 → 3</span>
        </div>
        <svg viewBox="-6 0 272 110" className="mt-2 h-28 w-full overflow-visible">
          <path
            d={`${path} L260 106 L0 106 Z`}
            className="fill-primary/10"
          />
          <path d={path} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" />
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 5 : 3} className={i === points.length - 1 ? "fill-coral" : "fill-primary"} />
          ))}
        </svg>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm">
        {[
          ["S", "Menos rigidez por las mañanas."],
          ["O", "La flexión lumbar mejora hasta 70°."],
          ["P", "Progresar a bisagra de cadera con carga la próxima sesión."],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-3">
            <span className="flex size-5 shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-medium">
              {k}
            </span>
            <span className="text-muted-foreground">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RemindPreview() {
  return (
    <div className="w-full max-w-[19rem] rounded-[2.25rem] border-[6px] border-foreground/90 bg-card p-4 shadow-2xl">
      <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-foreground/15" />
      <div className="flex items-center gap-2 border-b pb-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary">
          <MessageCircle className="size-4 text-primary-foreground" />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium">Clínica Fisio</span>
          <span className="text-[11px] text-muted-foreground">Mensaje automático</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 py-4 text-sm">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 motion-safe:animate-rise">
          ¡Hola, Lucía! Te recordamos tu sesión de mañana a las <b>10:30</b> con Laura.
          Responde <b>1</b> para confirmar o <b>2</b> para cambiarla.
        </div>
        <div
          className="max-w-[40%] self-end rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground motion-safe:animate-rise"
          style={{ animationDelay: "500ms" }}
        >
          1
        </div>
        <div
          className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 motion-safe:animate-rise"
          style={{ animationDelay: "1000ms" }}
        >
          ¡Perfecto, nos vemos mañana!
        </div>
      </div>
      <div
        className="flex items-center gap-2 rounded-xl bg-sage px-3 py-2 text-xs motion-safe:animate-rise"
        style={{ animationDelay: "1500ms" }}
      >
        <Check className="size-3.5" /> Confirmada · agenda actualizada
      </div>
    </div>
  );
}

const exercises = [
  { name: "Gato-camello", dose: "2 × 10", done: true },
  { name: "Puente de glúteo", dose: "3 × 12", done: true },
  { name: "Bird dog", dose: "3 × 8 cada lado", done: false },
];

export function RecoverPreview() {
  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Plan en casa · Lucía</span>
          <span className="font-medium">Semana 3: estabilidad del core</span>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs font-medium">
          <Flame className="size-3.5 text-coral" /> 5 días
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {exercises.map((ex, i) => (
          <div
            key={ex.name}
            className="flex items-center gap-3 rounded-xl border p-3 motion-safe:animate-rise"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Play className="size-4 fill-current" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{ex.name}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" /> {ex.dose}
              </span>
            </div>
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full border",
                ex.done && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {ex.done && <Check className="size-3.5" />}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-1">
        {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "size-7 rounded-full",
                i < 5 ? "bg-primary" : i === 5 ? "border-2 border-dashed border-primary" : "bg-muted",
              )}
            />
            <span className="text-[10px] text-muted-foreground">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
