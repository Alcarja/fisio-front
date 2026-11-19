import { useState, type ReactNode } from "react";
import { BellOff, BookUser, Search, X } from "lucide-react";
import type { AppointmentPatientInput, Patient } from "@/adapters/api";
import { useMe, usePatients } from "@/adapters/hook";
import { Input } from "@/components/ui/input";
import { hasFeature } from "@/lib/roles";
import { useDebounced } from "@/lib/useDebounced";
import { cn } from "@/lib/utils";
import { patientName } from "../calendarUtils";

type Props = {
  value: AppointmentPatientInput;
  onChange: (value: AppointmentPatientInput) => void;
  // For screen readers, e.g. "Paciente 2"
  label: string;
  // Fichas already in the appointment: not offered again
  excludeIds?: string[];
  autoFocus?: boolean;
  disabled?: boolean;
  // Shown at the end of the row (e.g. a "remove" button)
  trailing?: ReactNode;
  // false: used outside an appointment (e.g. a session recorded in Cobros):
  // no reminder email and hints that don't talk about "the appointment"
  forAppointment?: boolean;
};

type Mode = "ficha" | "name";

const empty: AppointmentPatientInput = { firstName: "", lastName: "" };

// One patient of an appointment.
//
// In clinics without the "Historia clínica" feature there's only name and
// surname, written by hand (no tabs, no fichas).
//
// With the feature, in one of two ways (the two tabs on top):
// - "Paciente con ficha": search the clinic's patients and choose one. The
//   appointment is linked to their ficha and shows in their history.
// - "Solo nombre": name and surname written by hand, saved on the appointment
//   only. No ficha is created
//
// With the "reminders" feature, a patient without ficha can also get an email
// (optional) for their reminders. Those with a ficha use the ficha's email
export default function PatientFields({
  value,
  onChange,
  label,
  excludeIds = [],
  autoFocus,
  disabled,
  trailing,
  forAppointment = true,
}: Props) {
  const { data: me } = useMe();
  // Linking appointments to fichas comes with the "Historia clínica" feature
  const canLink = hasFeature(me, "clinical_history");
  // A patient linked while the feature was on shows as a plain name without it.
  // Left untouched, the link is kept; retyping the name drops it
  const linked = canLink && !!value.patientId;
  const reminders = forAppointment && hasFeature(me, "reminders");
  // The ficha just chosen has no email: say it won't get reminders
  const [fichaWithoutEmail, setFichaWithoutEmail] = useState(false);

  const [chosenMode, setChosenMode] = useState<Mode | null>(null);
  const [query, setQuery] = useState("");
  // The list of patients shows while the search box is in use
  const [listOpen, setListOpen] = useState(false);

  // The value decides first, so the tab always matches what will be saved: a
  // linked ficha is "ficha", a written name is "name". With nothing yet, the
  // tab clicked last, starting on the search
  const mode: Mode = !canLink
    ? "name"
    : linked
      ? "ficha"
      : value.firstName || value.lastName
        ? "name"
        : (chosenMode ?? "ficha");

  // Typing a name: stay on "Solo nombre" even if the boxes are emptied again
  const changeName = (names: AppointmentPatientInput) => {
    setChosenMode("name");
    onChange({ ...names, ...(value.email ? { email: value.email } : {}) });
  };

  const search = useDebounced(query.trim());
  const { data, isPending, error } = usePatients(
    me?.activeClinic?.clinicId,
    { search, limit: 6 },
    mode === "ficha" && !linked,
  );
  const results = (data?.patients ?? []).filter((p) => !excludeIds.includes(p.id));

  // `force`: also when already on that tab (to drop the chosen patient)
  const changeMode = (next: Mode, force = false) => {
    if (next === mode && !force) return;
    setChosenMode(next);
    setQuery("");
    setFichaWithoutEmail(false);
    onChange(empty);
  };

  const choose = (p: Patient) => {
    setFichaWithoutEmail(!p.email);
    onChange({ patientId: p.id, firstName: p.firstName, lastName: p.lastName });
    setQuery("");
    setListOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="radiogroup"
        aria-label={`${label}: con ficha o solo nombre`}
        className={cn("flex gap-1", !canLink && "hidden")}
      >
        {(
          [
            ["ficha", "Paciente con ficha"],
            ["name", "Solo nombre"],
          ] as const
        ).map(([key, text]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={mode === key}
            disabled={disabled}
            onClick={() => changeMode(key)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
              mode === key
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {text}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-2">
        {mode === "name" ? (
          <>
            <Input
              autoFocus={autoFocus}
              disabled={disabled}
              value={value.firstName}
              onChange={(e) => changeName({ firstName: e.target.value, lastName: value.lastName })}
              placeholder="Nombre"
              aria-label={`${label}: nombre`}
              autoComplete="off"
            />
            <Input
              disabled={disabled}
              value={value.lastName}
              onChange={(e) => changeName({ firstName: value.firstName, lastName: e.target.value })}
              placeholder="Apellidos"
              aria-label={`${label}: apellidos`}
              autoComplete="off"
            />
          </>
        ) : linked ? (
          <div className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border bg-muted/40 pr-0.5 pl-2.5 text-sm">
            <BookUser className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{patientName(value)}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => changeMode("ficha", true)}
              aria-label={`${label}: elegir a otra persona`}
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div
            className="flex min-w-0 flex-1 flex-col gap-1.5"
            // Close the list when the focus leaves the search and its results
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setListOpen(false);
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus={autoFocus}
                disabled={disabled}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setListOpen(true);
                }}
                onFocus={() => setListOpen(true)}
                placeholder="Buscar por nombre, teléfono o NIF"
                aria-label={`${label}: buscar paciente con ficha`}
                autoComplete="off"
                className="pl-8"
              />
            </div>

            {listOpen && (
              <ul
                aria-label="Pacientes con ficha"
                className="flex max-h-48 flex-col divide-y overflow-y-auto rounded-lg border text-sm"
              >
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      // Keep the focus in the search box: in Safari a click on a
                      // button blurs it first, which would close the list
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(p)}
                      className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      <BookUser className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{patientName(p)}</span>
                      {(p.phone ?? p.email) && (
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {p.phone ?? p.email}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
                {results.length === 0 && (
                  <li className="px-2.5 py-2 text-xs text-muted-foreground">
                    {error
                      ? `No se pudieron cargar los pacientes: ${error.message}`
                      : isPending
                        ? "Buscando…"
                        : search
                          ? `Ningún paciente con ficha coincide con «${search}».`
                          : "Todavía no hay pacientes con ficha."}
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
        {trailing}
      </div>

      {mode === "name" && reminders && (
        <Input
          type="email"
          disabled={disabled}
          value={value.email ?? ""}
          onChange={(e) => {
            const email = e.target.value;
            onChange({
              firstName: value.firstName,
              lastName: value.lastName,
              ...(email ? { email } : {}),
            });
          }}
          placeholder="Email para el recordatorio (opcional)"
          aria-label={`${label}: email para el recordatorio`}
          autoComplete="off"
          maxLength={200}
        />
      )}
      {mode === "name" && reminders && !value.email?.trim() && (
        <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <BellOff className="size-3.5 shrink-0" />
          Sin email no recibirá recordatorio de la cita.
        </p>
      )}
      {linked && reminders && fichaWithoutEmail && (
        <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <BellOff className="size-3.5 shrink-0" />
          Su ficha no tiene email: no recibirá recordatorio. Puedes añadirlo en su ficha.
        </p>
      )}

      <p className={cn("text-xs text-muted-foreground", !canLink && "hidden")}>
        {!forAppointment
          ? mode === "name"
            ? "Solo se guarda el nombre. No se crea ficha."
            : linked
              ? "Enlazada a su ficha."
              : "Elige al paciente en la lista."
          : mode === "name"
            ? "Solo se guarda el nombre en esta cita. No se crea ficha."
            : linked
              ? "Enlazada a su ficha: la cita aparecerá en su historial."
              : "Elige al paciente en la lista para enlazar la cita a su ficha."}
      </p>
    </div>
  );
}
