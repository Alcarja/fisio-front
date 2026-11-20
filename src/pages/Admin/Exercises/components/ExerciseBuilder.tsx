import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Check, MessageSquarePlus, Plus, Search, X, CirclePlay } from "lucide-react";
import type { BodyRegion, Exercise, ExerciseType } from "@/adapters/api";
import { useExercises, useMe } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { bodyRegionLabels } from "../../Patients/clinicalFormat";
import { editorItemFromExercise, type EditorItem } from "../editorItems";
import { doseText, exerciseTypeLabels, looksLikeYoutube, plain } from "../exerciseFormat";
import DoseEditor from "./DoseEditor";
import ExerciseThumb from "./ExerciseThumb";

type Props = {
  items: EditorItem[];
  onChange: (items: EditorItem[]) => void;
  // Fields above and below the list (name, frequency, indications…)
  top?: ReactNode;
  bottom?: ReactNode;
  notesPlaceholder?: string;
};

// Building a tabla or a program: the bank on the left (click to add), the
// list on the right (doses, order, an indication per exercise). On phones,
// one above the other
export default function ExerciseBuilder({ items, onChange, top, bottom, notesPlaceholder }: Props) {
  const { data: me } = useMe();
  const { data: exercises = [] } = useExercises(me?.activeClinic?.clinicId);
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const add = (e: Exercise) => {
    const item = editorItemFromExercise(e);
    onChange([...items, item]);
    setJustAdded(item.key);
  };
  const setItem = (key: string, change: Partial<EditorItem>) =>
    onChange(items.map((i) => (i.key === key ? { ...i, ...change } : i)));
  const move = (index: number, by: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item!);
    onChange(next);
  };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 md:min-h-0 md:flex-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <BankPanel exercises={exercises} pickedIds={items.map((i) => i.exerciseId)} onAdd={add} />

      <div className="flex min-w-0 flex-col gap-4 md:min-h-0 md:overflow-y-auto md:pr-1">
        {top}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">
            Ejercicios {items.length > 0 && <span className="text-muted-foreground">({items.length})</span>}
          </span>
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              <ArrowLeft className="hidden size-5 md:block" />
              <ArrowUp className="size-5 md:hidden" />
              Elige ejercicios del banco para añadirlos aquí. Después ajusta series, repeticiones y descanso.
            </div>
          ) : (
            <ol className="flex flex-col gap-2">
              {items.map((item, index) => (
                <ItemCard
                  key={item.key}
                  item={item}
                  index={index}
                  last={index === items.length - 1}
                  exercise={byId.get(item.exerciseId)}
                  highlight={item.key === justAdded}
                  notesPlaceholder={notesPlaceholder}
                  onChange={(change) => setItem(item.key, change)}
                  onMove={(by) => move(index, by)}
                  onRemove={() => onChange(items.filter((i) => i.key !== item.key))}
                />
              ))}
            </ol>
          )}
        </div>
        {bottom}
      </div>
    </div>
  );
}

function ItemCard({
  item,
  index,
  last,
  exercise,
  highlight,
  notesPlaceholder = "Indicación para este ejercicio",
  onChange,
  onMove,
  onRemove,
}: {
  item: EditorItem;
  index: number;
  last: boolean;
  exercise?: Exercise;
  highlight: boolean;
  notesPlaceholder?: string;
  onChange: (change: Partial<EditorItem>) => void;
  onMove: (by: number) => void;
  onRemove: () => void;
}) {
  const [showNotes, setShowNotes] = useState(!!item.notes);
  const [showVideo, setShowVideo] = useState(!!item.videoUrl);
  const videoProblem = item.videoUrl.trim() && !looksLikeYoutube(item.videoUrl);
  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-3 transition-shadow",
        highlight && "motion-safe:animate-rise ring-2 ring-primary/20",
      )}
    >
      <div className="flex items-center gap-3">
        {exercise ? (
          <ExerciseThumb exercise={exercise} className="size-10 shrink-0" />
        ) : (
          <span className="size-10 shrink-0 rounded-lg bg-secondary" />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs text-muted-foreground tabular-nums">{index + 1}</span>
          <span className="truncate text-sm font-medium">{item.name}</span>
        </div>
        <div className="flex shrink-0">
          <Button type="button" variant="ghost" size="icon" className="size-7 rounded-full" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Subir">
            <ArrowUp />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7 rounded-full" disabled={last} onClick={() => onMove(1)} aria-label="Bajar">
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded-full text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={`Quitar ${item.name}`}
          >
            <X />
          </Button>
        </div>
      </div>
      <DoseEditor value={item} onChange={onChange} />
      {showNotes && (
        <Input
          autoFocus={!item.notes}
          value={item.notes}
          maxLength={1000}
          placeholder={notesPlaceholder}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="h-8 text-sm"
        />
      )}
      {showVideo && (
        <div className="flex flex-col gap-1">
          <div className="relative">
            <CirclePlay className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus={!item.videoUrl}
              type="url"
              inputMode="url"
              value={item.videoUrl}
              maxLength={300}
              placeholder="Enlace de YouTube (youtube.com o youtu.be)"
              aria-label={`Vídeo de YouTube de ${item.name}`}
              aria-invalid={!!videoProblem}
              onChange={(e) => onChange({ videoUrl: e.target.value })}
              className="h-8 pl-8 text-sm"
            />
          </div>
          {videoProblem && <p className="text-xs text-destructive">Tiene que ser un enlace de YouTube.</p>}
        </div>
      )}
      {(!showNotes || !showVideo) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {!showNotes && (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <MessageSquarePlus className="size-3.5" /> Añadir indicación
            </button>
          )}
          {!showVideo && (
            <button
              type="button"
              onClick={() => setShowVideo(true)}
              className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <CirclePlay className="size-3.5" /> Añadir vídeo de YouTube
            </button>
          )}
        </div>
      )}
    </li>
  );
}

const regions = Object.entries(bodyRegionLabels) as [BodyRegion, string][];

// The bank to pick from: search, a chip per zone and the type
function BankPanel({
  exercises,
  pickedIds,
  onAdd,
}: {
  exercises: Exercise[];
  pickedIds: string[];
  onAdd: (e: Exercise) => void;
}) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<BodyRegion | "">("");
  const [type, setType] = useState<ExerciseType | "">("");
  const words = plain(search).split(/\s+/).filter(Boolean);
  const shown = exercises.filter(
    (e) =>
      (!region || e.bodyRegions.includes(region)) &&
      (!type || e.type === type) &&
      words.every((w) => plain(e.name).includes(w)),
  );

  return (
    <div className="flex h-[26rem] min-w-0 flex-col gap-3 rounded-2xl border bg-muted/30 p-3 md:h-auto md:min-h-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Banco de ejercicios</span>
        <span className="text-xs text-muted-foreground">{shown.length}</span>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar"
          aria-label="Buscar en el banco"
          className="bg-background pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        <Chip active={!region} onClick={() => setRegion("")}>
          Todas
        </Chip>
        {regions.map(([key, label]) => (
          <Chip key={key} active={region === key} onClick={() => setRegion(region === key ? "" : key)}>
            {label}
          </Chip>
        ))}
      </div>
      <NativeSelect aria-label="Tipo" value={type} onChange={(e) => setType(e.target.value as ExerciseType | "")} className="w-full bg-background">
        <NativeSelectOption value="">Todos los tipos</NativeSelectOption>
        {Object.entries(exerciseTypeLabels).map(([k, l]) => (
          <NativeSelectOption key={k} value={k}>
            {l}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <ul className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1">
        {shown.map((e) => {
          const added = pickedIds.includes(e.id);
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onAdd(e)}
                className="group flex w-full items-center gap-3 rounded-xl bg-background p-2 text-left text-sm transition-colors hover:bg-secondary"
              >
                <ExerciseThumb exercise={e} className="size-10 shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{e.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {exerciseTypeLabels[e.type]} ·{" "}
                    {doseText(
                      { sets: e.defaultSets, reps: e.defaultReps, seconds: e.defaultSeconds, restSeconds: null, perSide: e.perSide },
                      false,
                    )}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                    added ? "border-primary bg-primary text-primary-foreground" : "group-hover:border-primary group-hover:text-primary",
                  )}
                  aria-label={added ? "Añadido (pulsa para añadirlo otra vez)" : "Añadir"}
                >
                  {added ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                </span>
              </button>
            </li>
          );
        })}
        {shown.length === 0 && <li className="px-2 py-4 text-center text-xs text-muted-foreground">Ningún ejercicio coincide.</li>}
      </ul>
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
        "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
