// Exports: turning what the backend sends into files the clinic can hand over.
// A patient's export comes in two shapes: a document to read or print (HTML,
// which every browser saves as PDF from its print dialog) and the raw data (JSON).
import type { PatientExport } from "@/adapters/api";
import { statusLabels } from "../Bookings/calendarUtils";
import {
  backgroundFields,
  closeOutcomeLabels,
  formatDate,
  regionAndSide,
} from "./clinicalFormat";

// Saves text as a file from the browser's memory
export function downloadFile(fileName: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// "García López, Ana" -> "garcia-lopez-ana"
export const fileSlug = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "paciente";

export const downloadJson = (fileName: string, data: unknown) =>
  downloadFile(fileName, JSON.stringify(data, null, 2), "application/json");

const e = (text: string) =>
  text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const dateTime = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeStyle: "short" });

// Rows of a definition list; the empty ones are left out
const rows = (pairs: [string, string | null | undefined][]) =>
  pairs
    .filter((pair): pair is [string, string] => !!pair[1])
    .map(([label, value]) => `<dt>${e(label)}</dt><dd>${e(value)}</dd>`)
    .join("");

// The patient's data and clinical history as one page to read or print
export function patientReportHtml({ exportedAt, clinic, patient: p }: PatientExport) {
  const name = `${p.firstName} ${p.lastName}`;

  const personal = rows([
    ["Teléfono", p.phone],
    ["Email", p.email],
    ["NIF / NIE", p.nif],
    ["Nacimiento", p.birthDate && formatDate(p.birthDate)],
    ["Dirección", [p.address, p.postalCode, p.city].filter(Boolean).join(", ")],
    ["Notas de la clínica", p.notes],
    ["Ficha creada", formatDate(p.createdAt.slice(0, 10))],
  ]);

  const background = rows(backgroundFields.map((f) => [f.label, p[f.key]]));

  const cases = p.cases
    .map((c) => {
      const notes = c.notes
        .map(
          (n) => `<li${n.deletedAt ? ' class="deleted"' : ""}>
            <strong>${e(formatDate(n.date))}</strong>${n.authorName ? ` · ${e(n.authorName)}` : ""}${
              n.painLevel === null ? "" : ` · Dolor ${n.painLevel}/10`
            }${n.deletedAt ? ` · Eliminada el ${e(formatDate(n.deletedAt.slice(0, 10)))}` : ""}
            <p>${e(n.text)}</p>
          </li>`,
        )
        .join("");
      return `<section>
        <h3>${e(c.title)}</h3>
        <dl>${rows([
          ["Zona", regionAndSide(c)],
          ["Estado", c.status === "open" ? "Abierto" : "Cerrado"],
          ["Apertura", formatDate(c.openedAt)],
          ["Inicio de la lesión", c.onsetDate && formatDate(c.onsetDate)],
          ["Fisio responsable", c.physioName],
          ["Motivo de consulta", c.reason],
          ["Valoración y diagnóstico", c.diagnosis],
          ["Objetivos y plan", c.plan],
          ["Cierre", c.closedAt && formatDate(c.closedAt)],
          ["Resultado", c.closeOutcome && closeOutcomeLabels[c.closeOutcome]],
          ["Comentario de cierre", c.closeNotes],
        ])}</dl>
        ${notes ? `<h4>Evolución</h4><ol>${notes}</ol>` : "<p>Sin notas de evolución.</p>"}
      </section>`;
    })
    .join("");

  const appointments = p.appointments
    .map(
      (a) =>
        `<tr><td>${e(formatDate(a.date))}</td><td>${e(a.startTime)}–${e(a.endTime)}</td><td>${e(a.serviceName)}</td><td>${e(a.physioName)}</td><td>${e(statusLabels[a.status])}</td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${e(name)} · ${e(clinic.name)}</title>
<style>
  body { font: 14px/1.5 system-ui, sans-serif; color: #1a1a1a; max-width: 46rem; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 1.6rem; margin: 0; }
  h2 { font-size: 1.1rem; margin: 2rem 0 .5rem; border-bottom: 1px solid #ccc; padding-bottom: .25rem; }
  h3 { font-size: 1rem; margin: 1.25rem 0 .25rem; }
  h4 { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: #555; margin: 1rem 0 .25rem; }
  .meta { color: #555; margin: .25rem 0 0; }
  dl { display: grid; grid-template-columns: 12rem 1fr; gap: .25rem 1rem; margin: 0; }
  dt { color: #555; } dd { margin: 0; white-space: pre-wrap; }
  ol { list-style: none; padding: 0; margin: 0; }
  li { border-left: 2px solid #ccc; padding: .25rem 0 .25rem .75rem; margin-bottom: .5rem; }
  li p { margin: .15rem 0 0; white-space: pre-wrap; }
  li.deleted { color: #777; text-decoration: line-through; }
  table { width: 100%; border-collapse: collapse; }
  td, th { text-align: left; padding: .25rem .5rem .25rem 0; border-bottom: 1px solid #eee; }
  section { break-inside: avoid; }
</style>
</head>
<body>
<h1>${e(name)}</h1>
<p class="meta">${e(clinic.name)} · Datos exportados el ${e(dateTime.format(new Date(exportedAt)))}</p>
<h2>Datos personales</h2>
<dl>${personal}</dl>
<h2>Antecedentes</h2>
${background ? `<dl>${background}</dl>` : "<p>Sin antecedentes anotados.</p>"}
<h2>Expedientes</h2>
${cases || "<p>Sin expedientes.</p>"}
<h2>Citas</h2>
${
  appointments
    ? `<table><thead><tr><th>Día</th><th>Hora</th><th>Servicio</th><th>Profesional</th><th>Estado</th></tr></thead><tbody>${appointments}</tbody></table>`
    : "<p>Sin citas.</p>"
}
</body>
</html>`;
}
