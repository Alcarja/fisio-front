import { Link } from "react-router";
import { paths } from "@/routes/paths";
import LegalPage, { LegalSection } from "./LegalPage";

// Política de cookies. The site only sets the login session cookie (Better
// Auth, back/src/auth.ts): strictly necessary, so the law asks for no banner.
// If analytics or any other non-essential cookie is ever added, this page
// needs updating AND the site needs a consent banner
export default function CookiesPage() {
  return (
    <LegalPage
      title={
        <>
          Política de <em className="text-coral">cookies</em>
        </>
      }
      intro="Este sitio solo usa las cookies imprescindibles para que puedas iniciar sesión. No usamos cookies de publicidad ni de analítica."
    >
      <LegalSection title="Qué es una cookie">
        <p>
          Un pequeño archivo que un sitio web guarda en tu navegador para recordar algo entre una
          página y la siguiente; por ejemplo, que ya has iniciado sesión.
        </p>
      </LegalSection>

      <LegalSection title="Las cookies que usamos">
        <ul>
          <li>
            <strong>Cookie de sesión</strong> (<code>better-auth.session_token</code>). Se crea
            cuando inicias sesión en la aplicación y sirve para reconocerte mientras trabajas. Dura
            como máximo 7 días y se borra al cerrar sesión. Es propia de Kineflow y no se comparte
            con nadie.
          </li>
        </ul>
        <p>
          Si solo visitas el sitio, pides cita en la página de una clínica o nos escribes desde el
          formulario de contacto, no guardamos ninguna cookie.
        </p>
      </LegalSection>

      <LegalSection title="Por qué no ves un aviso de cookies">
        <p>
          La ley exige pedir permiso para las cookies que no son necesarias, como las de publicidad
          o las de medición. Las estrictamente necesarias para prestar un servicio que has pedido,
          como la de sesión, están exentas. Como solo usamos esa, no hay nada que aceptar o rechazar.
        </p>
      </LegalSection>

      <LegalSection title="Cómo borrarlas o bloquearlas">
        <p>
          Puedes borrar o bloquear las cookies desde la configuración de tu navegador. Si bloqueas
          la de sesión, no podrás iniciar sesión en la aplicación.
        </p>
        <p>
          Más información sobre cómo tratamos tus datos en la{" "}
          <Link to={paths.privacy}>política de privacidad</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
