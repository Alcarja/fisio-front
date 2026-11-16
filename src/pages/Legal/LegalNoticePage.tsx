import { Link } from "react-router";
import { legalEntity as k } from "@/lib/legal";
import { paths } from "@/routes/paths";
import LegalPage, { LegalSection } from "./LegalPage";

// Aviso legal: who owns the site, as Spanish law asks of every commercial
// website (LSSI, art. 10), and the rules for using it
export default function LegalNoticePage() {
  return (
    <LegalPage
      title={
        <>
          Aviso <em className="text-coral">legal</em>
        </>
      }
      intro="Quién está detrás de este sitio web y en qué condiciones puedes usarlo."
    >
      <LegalSection title="Titular del sitio">
        <ul>
          <li>
            <strong>Titular:</strong> {k.legalName}
          </li>
          <li>
            <strong>NIF:</strong> {k.taxId}
          </li>
          <li>
            <strong>Domicilio:</strong> {k.address}
          </li>
          <li>
            <strong>Correo electrónico:</strong> <a href={`mailto:${k.email}`}>{k.email}</a>
          </li>
          {k.registry && (
            <li>
              <strong>Datos registrales:</strong> {k.registry}
            </li>
          )}
        </ul>
      </LegalSection>

      <LegalSection title="Qué es Kineflow">
        <p>
          Kineflow es una aplicación para gestionar clínicas de fisioterapia. Este sitio la presenta
          y da acceso a ella a las clínicas clientes y a su personal. El uso de la aplicación se
          rige por el contrato que cada clínica firma con Kineflow.
        </p>
      </LegalSection>

      <LegalSection title="Uso del sitio">
        <p>
          Puedes navegar por este sitio libremente. Te pedimos que lo uses de forma legal y que no
          intentes acceder a zonas o datos para los que no tienes permiso ni alterar su
          funcionamiento.
        </p>
      </LegalSection>

      <LegalSection title="Propiedad intelectual">
        <p>
          El nombre Kineflow, el logotipo, los textos, el diseño y el programa son de su titular o
          se usan con licencia. No puedes copiarlos ni reutilizarlos con fines comerciales sin
          permiso por escrito.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilidad">
        <p>
          Procuramos que la información del sitio sea correcta y esté al día, y que el sitio
          funcione sin interrupciones, pero no podemos garantizarlo en todo momento. No respondemos
          del contenido de los sitios de terceros a los que podamos enlazar.
        </p>
      </LegalSection>

      <LegalSection title="Datos personales y cookies">
        <p>
          Lo explicamos en la <Link to={paths.privacy}>política de privacidad</Link> y en la{" "}
          <Link to={paths.cookies}>política de cookies</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Ley aplicable">
        <p>
          Este aviso se rige por la ley española. Para cualquier desacuerdo serán competentes los
          juzgados y tribunales de {k.courtsCity}, salvo que la ley de consumidores establezca otro
          fuero.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
