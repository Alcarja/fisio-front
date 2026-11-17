import { useState } from "react";
import { useActivePrograms, useMe } from "@/adapters/hook";
import { cn } from "@/lib/utils";
import ActivePrograms from "./components/ActivePrograms";
import ExerciseBank from "./components/ExerciseBank";
import TemplatesList from "./components/TemplatesList";

type Tab = "templates" | "active" | "bank";

// Owners, admins and physios: the clinic's tablas, who has exercises right
// now, and the bank. Protected in the router (clinicalAccess) and in the backend
export default function ExercisesPage() {
  const { data: me } = useMe();
  const { data: active } = useActivePrograms(me?.activeClinic?.clinicId);
  const [tab, setTab] = useState<Tab>("templates");

  const tabs: [Tab, string, number | undefined][] = [
    ["templates", "Tablas", undefined],
    ["active", "En curso", active?.length],
    ["bank", "Banco de ejercicios", undefined],
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-coral">{me?.activeClinic?.clinicName ?? "Clínica"}</span>
        <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">Ejercicios</h1>
        <p className="text-muted-foreground">
          Ejercicios para casa: prepara tablas, páutalas a tus pacientes y sigue quién las tiene en curso.
        </p>
      </header>

      <div role="tablist" aria-label="Secciones de ejercicios" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex w-fit gap-1 rounded-full border bg-card p-1">
          {tabs.map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
                tab === key ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              {!!count && (
                <span className="rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground tabular-nums">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "templates" ? <TemplatesList /> : tab === "active" ? <ActivePrograms /> : <ExerciseBank />}
    </div>
  );
}
