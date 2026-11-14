import type { ReactNode } from "react";
import { ArrowRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

function Tile({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex flex-col justify-between gap-8 overflow-hidden rounded-[1.75rem] border bg-card p-6 transition-shadow hover:shadow-[0_24px_48px_-24px_rgb(20_60_50/0.25)]",
        className,
      )}
    >
      <div className="flex flex-1 items-center justify-center">{children}</div>
      <div className="flex flex-col gap-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function SessionPack() {
  const used = 6;
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">Bono de 10 sesiones</span>
        <span className="font-display text-3xl leading-none">
          {used}
          <span className="text-muted-foreground">/10</span>
        </span>
      </div>
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "aspect-square rounded-full transition-transform duration-300 group-hover:scale-110",
              i < used ? "bg-primary" : "bg-muted",
            )}
            style={{ transitionDelay: `${i * 30}ms` }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">Quedan 4 · aviso de renovación al llegar a 2</span>
    </div>
  );
}

function Invoice() {
  return (
    <div className="w-full max-w-[15rem] rotate-[-3deg] rounded-xl border bg-background p-4 shadow-md transition-transform duration-500 group-hover:rotate-0">
      <div className="flex items-center justify-between">
        <FileText className="size-4 text-muted-foreground" />
        <span className="rounded-full bg-sage px-2 py-0.5 text-[10px] font-medium">Pagada</span>
      </div>
      <div className="mt-4 flex flex-col gap-2 text-xs">
        <div className="flex justify-between"><span className="text-muted-foreground">Fisioterapia × 2</span><span>90 €</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Punción seca</span><span>20 €</span></div>
        <div className="mt-1 flex justify-between border-t pt-2 font-medium"><span>Total</span><span>110 €</span></div>
      </div>
    </div>
  );
}

function Signature() {
  return (
    <div className="flex w-full max-w-[15rem] flex-col gap-2">
      <span className="text-xs text-muted-foreground">Consentimiento · tratamiento de datos</span>
      <svg viewBox="0 0 220 70" className="h-16 w-full">
        <path
          d="M8 48 C 20 10, 34 10, 30 44 S 52 60, 60 30 S 78 20, 82 46 C 86 62, 104 18, 118 34 S 140 58, 150 36 C 158 22, 170 30, 176 42 L 210 40"
          fill="none"
          strokeWidth="2.2"
          strokeLinecap="round"
          pathLength={1}
          className="stroke-foreground [stroke-dasharray:1] motion-safe:group-hover:animate-draw"
        />
      </svg>
      <div className="flex items-center justify-between border-t pt-2 text-xs">
        <span>Lucía Fernández</span>
        <span className="text-muted-foreground">Firmado en tablet</span>
      </div>
    </div>
  );
}

function Occupancy() {
  const days = [
    { d: "Lun", v: 82 },
    { d: "Mar", v: 94 },
    { d: "Mié", v: 76 },
    { d: "Jue", v: 88 },
    { d: "Vie", v: 64 },
  ];
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-5xl leading-none">81%</span>
        <span className="text-sm text-muted-foreground">de ocupación esta semana</span>
      </div>
      <div className="flex h-32 items-end gap-3">
        {days.map(({ d, v }) => (
          <div key={d} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-24 w-full items-end">
              <div
                className={cn(
                  "w-full origin-bottom rounded-t-lg transition-transform duration-500 group-hover:scale-y-105",
                  v === 94 ? "bg-coral" : "bg-primary/80",
                )}
                style={{ height: `${v}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WaitingList() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <div className="flex items-center gap-2 rounded-xl border border-dashed p-3 text-sm">
        <span className="size-2 rounded-full bg-coral motion-safe:animate-pulse-ring" />
        Se acaba de liberar las 17:00 con Marta
      </div>
      <div className="ml-4 flex flex-col gap-2 border-l pl-4">
        {["Ofrecido a Javier", "Ofrecido a Carmen", "Reservado por Andrés"].map((s, i) => (
          <div key={s} className="flex items-center gap-2 text-xs">
            <ArrowRight className="size-3 text-muted-foreground" />
            <span className={cn(i === 2 ? "font-medium" : "text-muted-foreground")}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Team() {
  const people = [
    { i: "LM", c: "bg-sage" },
    { i: "CR", c: "bg-sand" },
    { i: "MS", c: "bg-sky" },
    { i: "IN", c: "bg-lilac" },
  ];
  const rooms = [
    { name: "Sala 1", busy: [0, 1, 1, 0, 1, 1, 1, 0] },
    { name: "Sala 2", busy: [1, 1, 0, 0, 1, 0, 1, 1] },
    { name: "Gimnasio", busy: [0, 0, 1, 1, 1, 1, 0, 0] },
  ];
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <div className="flex -space-x-2">
        {people.map((p) => (
          <span
            key={p.i}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border-2 border-card text-xs font-medium transition-transform group-hover:-translate-y-0.5",
              p.c,
            )}
          >
            {p.i}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {rooms.map((r) => (
          <div key={r.name} className="flex items-center gap-3">
            <span className="w-14 text-xs text-muted-foreground">{r.name}</span>
            <div className="grid flex-1 grid-cols-8 gap-0.5">
              {r.busy.map((b, i) => (
                <span key={i} className={cn("h-3 rounded-sm", b ? "bg-primary/70" : "bg-muted")} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeatureBento() {
  return (
    <section className="mx-auto max-w-6xl px-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex max-w-2xl flex-col gap-4">
          <span className="text-sm font-medium text-coral">Todo en su sitio</span>
          <h2 className="font-display text-5xl leading-[1.02] tracking-tight text-balance md:text-6xl">
            El resto de la clínica, resuelto.
          </h2>
        </div>
        <p className="max-w-sm text-muted-foreground">
          Empieza por la agenda. Activa el resto cuando tu clínica lo necesite.
        </p>
      </div>

      <div className="mt-12 grid auto-rows-[minmax(18rem,auto)] gap-4 md:grid-cols-3">
        <Tile
          className="md:col-span-2"
          title="Informes que se entienden"
          description="Ocupación, ingresos por fisio y tasa de ausencias, sin exportar ni una hoja de cálculo."
        >
          <Occupancy />
        </Tile>
        <Tile title="Bonos de sesiones" description="Vende bonos y controla cada sesión consumida.">
          <SessionPack />
        </Tile>
        <Tile title="Facturación" description="Facturas y cobros en dos clics.">
          <Invoice />
        </Tile>
        <Tile title="Lista de espera" description="Los huecos cancelados se llenan solos.">
          <WaitingList />
        </Tile>
        <Tile title="Consentimiento digital" description="Formularios conformes al RGPD, firmados en cualquier dispositivo.">
          <Signature />
        </Tile>
        <Tile
          className="md:col-span-3 md:flex-row md:items-center"
          title="Equipo y salas"
          description="Horarios, vacaciones y salas de tratamiento, para que nadie acabe citado en una sala ocupada."
        >
          <Team />
        </Tile>
      </div>
    </section>
  );
}
