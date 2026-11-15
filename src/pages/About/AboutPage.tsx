import CtaBand from "@/components/CtaBand";
import { cn } from "@/lib/utils";

const principles = [
  {
    title: "Sencillo por defecto",
    description:
      "Si necesita una formación, es que no hemos terminado de diseñarlo. Los fisios deben dedicar su tiempo a los pacientes, no al software.",
  },
  {
    title: "Pensado alrededor de la sesión",
    description:
      "Todo parte de los 45 minutos que un paciente pasa en la clínica: lo que ocurre antes, durante y después.",
  },
  {
    title: "Privacidad desde el diseño",
    description:
      "Los datos de tus pacientes son de los más sensibles que existen. Cada clínica solo ve los suyos, y cada persona solo lo que su rol le permite.",
  },
  {
    title: "Crece a tu ritmo",
    description:
      "Un fisio autónomo y una clínica con diez salas no necesitan lo mismo. Configura solo lo que uses: una sala o diez, un servicio o veinte.",
  },
];

// Keep "Ya disponible" in sync with what the app really does
const roadmap = [
  {
    stage: "Ya disponible",
    note: "Funcionando",
    items: [
      "Agenda del equipo por día y semana",
      "Salas, servicios y horarios",
      "Equipo con roles e invitaciones",
      "Informes mensuales",
    ],
    accent: "bg-primary",
  },
  {
    stage: "Próximamente",
    note: "En diseño",
    items: ["Fichas de pacientes e historias clínicas", "Recordatorios de citas", "Reserva online"],
    accent: "bg-coral",
  },
  {
    stage: "Más adelante",
    note: "Explorando",
    items: ["Facturación y bonos", "Lista de espera", "Planes de ejercicios en casa"],
    accent: "bg-muted-foreground/40",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-28 md:space-y-36">
      {/* Intro */}
      <section className="relative isolate">
        <div
          className="pointer-events-none absolute -top-24 right-0 -z-10 h-[30rem] w-[40rem] rounded-full bg-[radial-gradient(closest-side,var(--sand),transparent)] opacity-80"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-5 pt-16 md:pt-24">
          <span className="text-sm font-medium text-coral motion-safe:animate-rise">Sobre Kineflow</span>
          <h1
            className="mt-6 max-w-5xl font-display text-6xl leading-[0.95] tracking-tight text-balance motion-safe:animate-rise sm:text-7xl md:text-8xl"
            style={{ animationDelay: "80ms" }}
          >
            Hecho para quienes nos mantienen en <em className="text-coral">movimiento</em>.
          </h1>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[1fr_2fr] md:gap-16">
        <div className="md:sticky md:top-28 md:self-start">
          <span className="text-sm text-muted-foreground">Por qué existimos</span>
        </div>
        <div className="flex flex-col gap-6 text-lg leading-relaxed text-pretty md:text-xl">
          <p>
            Entra en casi cualquier clínica de fisioterapia y verás lo mismo:
            una agenda de papel en recepción, una hoja de cálculo para las
            facturas, las notas de los pacientes en un cajón y un móvil que no
            para de sonar con WhatsApps sobre las citas de mañana.
          </p>
          <p className="text-muted-foreground">
            No es culpa de nadie. Las herramientas simplemente no se pensaron para
            cómo funciona una clínica. Se pensaron para hospitales, o para
            peluquerías.
          </p>
          <blockquote className="my-6 border-l-2 border-coral pl-6 font-display text-3xl leading-tight tracking-tight md:text-4xl">
            Estamos creando la herramienta que nos gustaría que todo fisio tuviera desde el primer día.
          </blockquote>
          <p className="text-muted-foreground">
            Kineflow empieza por lo que más tiempo quita: la agenda del equipo,
            las salas y la organización de la clínica, en un solo lugar y
            diseñado con fisioterapeutas, no solo para ellos.
          </p>
        </div>
      </section>

      {/* Principles */}
      <section className="mx-auto max-w-6xl px-5">
        <h2 className="font-display text-5xl leading-[1.02] tracking-tight md:text-6xl">
          En qué creemos.
        </h2>
        <div className="mt-12 grid border-t sm:grid-cols-2">
          {principles.map((p, i) => (
            <div
              key={p.title}
              className={cn(
                "group flex flex-col gap-4 border-b py-10 sm:px-8",
                i % 2 === 0 ? "sm:border-r sm:pl-0" : "sm:pr-0",
              )}
            >
              <span className="font-display text-2xl text-muted-foreground tabular-nums transition-colors group-hover:text-coral">
                0{i + 1}
              </span>
              <h3 className="font-display text-3xl tracking-tight">{p.title}</h3>
              <p className="max-w-md text-muted-foreground">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="font-display text-5xl leading-[1.02] tracking-tight md:text-6xl">
            Hacia dónde vamos.
          </h2>
          <p className="max-w-sm text-muted-foreground">
            Estamos empezando y construimos de forma abierta. Esto es lo que tenemos entre manos.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {roadmap.map((column) => (
            <div key={column.stage} className="flex flex-col gap-6 rounded-[1.75rem] border bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl">{column.stage}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("size-2 rounded-full", column.accent)} />
                  {column.note}
                </span>
              </div>
              <ul className="flex flex-col gap-3">
                {column.items.map((item) => (
                  <li key={item} className="rounded-xl bg-muted/60 px-4 py-3 text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
