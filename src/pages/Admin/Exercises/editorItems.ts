// One exercise of a tabla or a program while it's being edited, and how it
// goes to and from the API. The dose is text, the way the inputs hold it
import type { Dose, Exercise, ListItemInput } from "@/adapters/api";

export type EditorItem = {
  key: string;
  exerciseId: string;
  name: string;
  // "reps": series × repetitions (and optionally hold seconds) ·
  // "time": series × seconds (stretches, planks, balance)
  mode: "reps" | "time";
  sets: string;
  reps: string;
  seconds: string;
  rest: string;
  perSide: boolean;
  notes: string;
  // YouTube link the patient sees ("" = none)
  videoUrl: string;
};

const str = (n: number | null) => (n === null ? "" : String(n));
const num = (s: string) => (s.trim() === "" ? null : Number(s));
let counter = 0;

export const toEditorItem = (
  item: Dose & { exerciseId: string; notes: string | null; videoUrl?: string | null },
  name: string,
): EditorItem => ({
  key: `item-${++counter}`,
  exerciseId: item.exerciseId,
  name,
  mode: !item.reps && item.seconds ? "time" : "reps",
  sets: str(item.sets),
  reps: str(item.reps),
  seconds: str(item.seconds),
  rest: str(item.restSeconds),
  perSide: item.perSide,
  notes: item.notes ?? "",
  videoUrl: item.videoUrl ?? "",
});

export const fromEditorItem = (item: EditorItem): ListItemInput => ({
  exerciseId: item.exerciseId,
  sets: num(item.sets),
  reps: item.mode === "reps" ? num(item.reps) : null,
  seconds: num(item.seconds),
  restSeconds: num(item.rest),
  perSide: item.perSide,
  notes: item.notes.trim() || null,
  videoUrl: item.videoUrl.trim() || null,
});

export const editorItemFromExercise = (e: Exercise): EditorItem =>
  toEditorItem(
    {
      exerciseId: e.id,
      sets: e.defaultSets,
      reps: e.defaultReps,
      seconds: e.defaultSeconds,
      restSeconds: e.defaultRestSeconds,
      perSide: e.perSide,
      notes: null,
      videoUrl: e.videoUrl,
    },
    e.name,
  );

// The dose an exercise of the bank brings, as editable text (its own form)
export type DoseDraft = Pick<EditorItem, "mode" | "sets" | "reps" | "seconds" | "rest" | "perSide">;

export const draftFromExercise = (e?: Exercise): DoseDraft => {
  if (!e) return { mode: "reps", sets: "3", reps: "10", seconds: "", rest: "60", perSide: false };
  const { mode, sets, reps, seconds, rest, perSide } = editorItemFromExercise(e);
  return { mode, sets, reps, seconds, rest, perSide };
};

export const doseFromDraft = (d: DoseDraft) => ({
  defaultSets: num(d.sets),
  defaultReps: d.mode === "reps" ? num(d.reps) : null,
  defaultSeconds: num(d.seconds),
  defaultRestSeconds: num(d.rest),
  perSide: d.perSide,
});
