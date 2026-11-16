import { Link } from "react-router";
import { legalEntity as k } from "@/lib/legal";
import { paths } from "@/routes/paths";
import LegalPage, { LegalSection } from "./LegalPage";

// Política de privacidad. Two different situations, kept apart on purpose:
// data Kineflow decides about (the website, clinics' staff accounts, its own
// customers) and patients' data, which belongs to each clinic (#pacientes: the
// public booking page links there).
// The providers are described by what they do and where, not by name: the law
// allows categories here, and their names are in the contract each clinic signs
// (../legal/docs/02-encargo-del-tratamiento.html, Anexo III). Anyone who asks
// must be told who they are, so the page says how to ask
export default function PrivacyPage() {
  return (
    <LegalPage
      title={
        <>
          Política de <em className="text-coral">privacidad</em>
        </>
      }
      intro="Qué datos personales tratamos en Kineflow, para qué, durante cuánto tiempo y qué puedes hacer al respecto."
    >
      <LegalSection title="Quién es el responsable">
        <p>
          {k.legalName}, con NIF {k.taxId} y domicilio en {k.address} («Kineflow»).
        </p>
        <p>
          Para cualquier asunto de protección de datos, escríbenos a{" "}
          <a href={`mailto:${k.privacyEmail}`}>{k.privacyEmail}</a>.
        </p>
      </LegalSection>

      <LegalSection id="pacientes" title="Si eres paciente de una clínica">
        <p>
          Cuando una clínica de fisioterapia usa Kineflow para gestionar tus citas o tu historia
          clínica, <strong>la responsable de tus datos es la clínica</strong>, no Kineflow. Es ella
          quien decide qué datos recoge y para qué, y quien debe informarte.
        </p>
        <p>
          Kineflow solo guarda esos datos por cuenta de la clínica, con un contrato que nos obliga a
          protegerlos y nos prohíbe usarlos para cualquier otra cosa. No los cedemos, no los usamos
          con fines propios y solo accedemos a ellos cuando es imprescindible para mantener el
          servicio.
        </p>
        <p>
          Para consultar, corregir o pedir una copia de tus datos, <strong>dirígete a tu clínica</strong>.
          Si nos escribes a nosotros, le remitiremos tu solicitud.
        </p>
      </LegalSection>

      <LegalSection title="Qué datos tratamos y para qué">
        <p>
          <strong>Si nos escribes desde el formulario de contacto.</strong> Tratamos tu nombre, tu
          correo electrónico, tu teléfono, el nombre de tu clínica y lo que nos cuentes, solo para
          responderte. La base legal es tu consentimiento y tu interés en contratar el servicio.
          Los conservamos mientras dure la conversación y, si no llegas a ser cliente, los borramos
          cuando deja de tener sentido guardarlos.
        </p>
        <p>
          <strong>Si trabajas en una clínica que usa Kineflow.</strong> Tratamos tu nombre, tu
          correo electrónico, tu rol en la clínica, tu contraseña (guardada de forma que nadie puede
          leerla) y datos técnicos de tus sesiones (fecha, dirección IP y navegador), para darte
          acceso y proteger tu cuenta. La base legal es el contrato con tu clínica. Los conservamos
          mientras tengas cuenta.
        </p>
        <p>
          <strong>Si tu clínica es cliente nuestro.</strong> Tratamos los datos de facturación y de
          contacto del titular para prestar el servicio y cumplir nuestras obligaciones fiscales y
          contables. Los conservamos durante los plazos que marca la ley.
        </p>
        <p>No hacemos perfiles ni tomamos decisiones automatizadas con tus datos.</p>
      </LegalSection>

      <LegalSection title="Con quién los compartimos">
        <p>No vendemos ni cedemos datos a terceros. Solo acceden a ellos los proveedores que nos ayudan a prestar el servicio, con un contrato que les obliga a protegerlos:</p>
        <ul>
          <li>
            <strong>Un proveedor de bases de datos</strong>, que guarda los datos en Alemania.
          </li>
          <li>
            <strong>Un proveedor de servidores</strong>, donde funciona la aplicación, en{" "}
            {k.hostingLocation}.
          </li>
          <li>
            <strong>Un proveedor de envío de correos electrónicos</strong>, en la Unión Europea.
          </li>
        </ul>
        <p>
          Si quieres saber qué empresas son, escríbenos a{" "}
          <a href={`mailto:${k.privacyEmail}`}>{k.privacyEmail}</a> y te lo diremos. Las clínicas
          clientes tienen la lista completa en su contrato.
        </p>
        <p>
          Los datos se almacenan en el Espacio Económico Europeo. Si alguno de estos proveedores
          accediera a ellos desde fuera, lo haría con las garantías que exige el Reglamento General
          de Protección de Datos.
        </p>
      </LegalSection>

      <LegalSection title="Tus derechos">
        <p>
          Puedes pedirnos acceder a tus datos, corregirlos, suprimirlos, limitar u oponerte a su uso,
          y llevártelos a otro proveedor. Si nos diste tu consentimiento, puedes retirarlo cuando
          quieras. Escríbenos a <a href={`mailto:${k.privacyEmail}`}>{k.privacyEmail}</a> y te
          responderemos en un mes como máximo.
        </p>
        <p>
          Si crees que no hemos tratado bien tus datos, puedes reclamar ante la{" "}
          <a href="https://www.aepd.es" target="_blank" rel="noreferrer">
            Agencia Española de Protección de Datos
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Cómo los protegemos">
        <p>
          Las comunicaciones viajan cifradas, la base de datos se guarda cifrada y los textos
          clínicos se cifran además dentro de la propia aplicación. Cada clínica solo accede a sus
          datos y cada persona solo a lo que su rol le permite.
        </p>
        <p>
          Este sitio solo usa las cookies imprescindibles para iniciar sesión. Lo explicamos en la{" "}
          <Link to={paths.cookies}>política de cookies</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Cambios en esta política">
        <p>
          Si cambiamos algo importante, lo publicaremos aquí con la nueva fecha y avisaremos a las
          clínicas clientes.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
