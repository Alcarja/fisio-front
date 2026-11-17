import { useState, type ReactNode } from "react";
import { CircleAlert, Loader2, Plus, Search, SearchX } from "lucide-react";
import type { BodyRegion, Equipment, Exercise, ExerciseType } from "@/adapters/api";
import { useExercises, useMe } from "@/adapters/hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { bodyRegionLabels } from "../../Patients/clinicalFormat";
import { doseText, equipmentLabels, exerciseTypeLabels, plain } from "../exerciseFormat";
import ExerciseDialog from "./ExerciseDialog";
import ExerciseThumb from "./ExerciseThumb";

const regions = Object.entries(bodyRegionLabels) as [BodyRegion, string][];

// The bank: the clinic's exercises and Kineflow's base ones. A chip per zone
// to narrow it fast; a click on an exercise opens it (and its actions)
export default function ExerciseBank() {
  const { data: me } = useMe();
  const { data: exercises, isPending, error } = useExercises(me?.activeClinic?.clinicId);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<BodyRegion | "">("");
  const [type, setType] = useState<ExerciseType | "">("");
  const [equipment, setEquipment] = useState<Equipment | "">("");
  const [ownOnly, setOwnOnly] = useState(false);
  const [open, setOpen] = useState<Exercise | "new" | null>(null);

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
        <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error.message}
      </p>
    );
  }

  const words = plain(search).split(/\s+/).filter(Boolean);
  const shown = exercises.filter(
    (e) =>
      (!region || e.bodyRegions.includes(region)) &&
      (!type || e.type === type) &&
      (!equipment || e.equipment.includes(equipment)) &&
      (!ownOnly || !e.isBase) &&
      words.every((w) => plain(e.name).includes(w)),
  );
  const own = exercises.filter((e) => !e.isBase).length;
  const filtered = !!(search || region || type || equipment || ownOnly);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-xl text-sm text-muted-foreground">
          {exercises.length} ejercicios: {own} de tu clínica y {exercises.length - own} del banco de Kineflow. Abre uno de
          Kineflow y pulsa «Duplicar y editar» para adaptarlo y ponerle tu imagen.
        </p>
        <Button className="w-fit shrink-0 rounded-full" onClick={() => setOpen("new")}>
          <Plus /> Nuevo ejercicio
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-[1.75rem] border bg-card p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ejercicio"
              aria-label="Buscar ejercicio"
              className="pl-9"
            />
          </div>
          <NativeSelect aria-label="Tipo" value={type} onChange={(e) => setType(e.target.value as ExerciseType | "")}>
            <NativeSelectOption value="">Todos los tipos</NativeSelectOption>
            {Object.entries(exerciseTypeLabels).map(([k, l]) => (
              <NativeSelectOption key={k} value={k}>
                {l}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Material" value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment | "")}>
            <NativeSelectOption value="">Cualquier material</NativeSelectOption>
            {Object.entries(equipmentLabels).map(([k, l]) => (
              <NativeSelectOption key={k} value={k}>
                {l}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip active={!region} onClick={() => setRegion("")}>
            Todas las zonas
          </Chip>
          {regions.map(([key, label]) => (
            <Chip key={key} active={region === key} onClick={() => setRegion(region === key ? "" : key)}>
              {label}
            </Chip>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
          <Chip active={ownOnly} onClick={() => setOwnOnly((o) => !o)}>
            Solo los de mi clínica
          </Chip>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[1.75rem] border border-dashed p-8 text-center text-sm text-muted-foreground">
          <SearchX className="size-5" />
          {ownOnly && own === 0
            ? "Tu clínica todavía no tiene ejercicios propios. Crea uno o duplica uno de Kineflow."
            : "Ningún ejercicio coincide con estos filtros."}
        </div>
      ) : (
        <>
          {filtered && <p className="-mt-2 text-xs text-muted-foreground">{shown.length} ejercicios</p>}
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setOpen(e)}
                  className="flex h-full w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-shadow hover:shadow-[0_12px_32px_-16px_rgb(20_60_50/0.3)]"
                >
                  <ExerciseThumb exercise={e} className="size-14 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="line-clamp-2 text-sm leading-snug font-medium">{e.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {exerciseTypeLabels[e.type]} ·{" "}
                      {doseText(
                        { sets: e.defaultSets, reps: e.defaultReps, seconds: e.defaultSeconds, restSeconds: null, perSide: e.perSide },
                        false,
                      )}
                    </span>
                  </span>
                  {!e.isBase && <Badge variant="secondary">Tuyo</Badge>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {open && (
        <ExerciseDialog
          // Remount when switching to the duplicated copy
          key={open === "new" ? "new" : open.id}
          exercise={open === "new" ? undefined : (exercises.find((x) => x.id === open.id) ?? open)}
          onClose={() => setOpen(null)}
          onDuplicated={(copy) => setOpen(copy)}
        />
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
