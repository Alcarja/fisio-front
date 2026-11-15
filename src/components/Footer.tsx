import { Link } from "react-router";
import Logo from "@/components/Logo";
import { paths } from "@/routes/paths";

const columns = [
  {
    title: "Producto",
    links: [
      { label: "Agenda", to: `${paths.home}#how` },
      { label: "Equipo y salas", to: `${paths.home}#how` },
      { label: "Informes", to: `${paths.home}#how` },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre nosotros", to: paths.about },
      { label: "Contacto", to: paths.contact },
    ],
  },
];

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo animated={false} />
          <p className="max-w-xs text-sm text-muted-foreground">
            Gestiona tu clínica de fisioterapia y deja que todo fluya.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">{column.title}</h3>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 border-t px-5 py-6 text-xs text-muted-foreground sm:flex-row">
        <span>© {year} Kineflow</span>
        <span>Hecho para fisioterapeutas</span>
      </div>
    </footer>
  );
}
