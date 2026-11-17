import { Link } from "react-router";
import { ArrowRight, Download, History, Lock, MapPin, ScrollText, UserCheck } from "lucide-react";
import { paths } from "@/routes/paths";

// Only what the app really does (back/src/lib/encryption.ts, clinicalLog.ts,
// export.controller.ts, roles in lib/roles.ts). Keep it true: clinics and their
// advisers read this, and the contracts promise the same
const points = [
  {
    icon: Lock,
    title: "Historia clínica cifrada",
    description:
      "Diagnósticos, antecedentes y notas se guardan cifrados. Quien consiguiera una copia de la base de datos no podría leerlos.",
  },
  {
    icon: MapPin,
    title: "Tus datos, en Alemania",
    description:
      "Servidores y base de datos en la Unión Europea. Las comunicaciones viajan siempre cifradas.",
  },
  {
    icon: UserCheck,
    title: "Cada persona, lo suyo",
    description:
      "Cada clínica solo ve sus pacientes. Recepción gestiona citas y contactos, pero no abre la historia clínica.",
  },
  {
    icon: ScrollText,
    title: "Registro de accesos",
    description:
      "Queda anotado quién ha visto, cambiado o exportado la historia de cada paciente, y cuándo.",
  },
  {
    icon: History,
    title: "Nada se pierde",
    description:
      "Al corregir una nota se guarda lo que decía antes, y una historia clínica con expedientes no se puede borrar por error.",
  },
  {
    icon: Download,
    title: "Tus datos son tuyos",
    description:
      "Exporta la ficha completa de un paciente o los de toda la clínica cuando quieras. Sin permanencia.",
  },
];

export default function PrivacySection() {
  return (
    <section id="privacidad" className="mx-auto max-w-6xl scroll-mt-24 px-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex max-w-2xl flex-col gap-4">
          <span className="text-sm font-medium text-coral">Privacidad</span>
          <h2 className="font-display text-5xl leading-[1.02] tracking-tight text-balance md:text-6xl">
            Los datos de tus pacientes, <em className="text-coral">protegidos</em>.
          </h2>
        </div>
        <p className="max-w-sm text-muted-foreground">
          Son datos de salud. Los tratamos como tales desde el primer día, con un contrato de
          encargo del tratamiento firmado con cada clínica.
        </p>
      </div>

      <div className="mt-12 grid gap-px overflow-hidden rounded-[1.75rem] border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {points.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col gap-3 bg-card p-6">
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
              <Icon className="size-4" />
            </span>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>

      <Link
        to={paths.privacy}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
      >
        Lee nuestra política de privacidad <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}
