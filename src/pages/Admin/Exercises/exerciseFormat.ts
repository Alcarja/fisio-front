// Ejercicios: labels and small helpers. Keys mirror back/src/lib/exercises.ts
import type { Dose, Equipment, Exercise, ExerciseType, ListItemInput } from "@/adapters/api";

export const exerciseTypeLabels: Record<ExerciseType, string> = {
  mobility: "Movilidad",
  strength: "Fuerza",
  stretching: "Estiramiento",
  balance: "Equilibrio",
  breathing: "Respiración",
};

export const equipmentLabels: Record<Equipment, string> = {
  none: "Sin material",
  mat: "Esterilla",
  band: "Banda elástica",
  dumbbell: "Mancuerna",
  fitball: "Fitball",
  step: "Escalón",
  chair: "Silla",
  wall: "Pared",
  towel: "Toalla",
  foam_roller: "Rulo",
};

// "3 × 12 · cada lado · descanso 60 s", "3 × 30 s"
export function doseText(d: Dose, withRest = true) {
  const amount = d.reps ? `${d.reps}${d.seconds ? ` × ${d.seconds} s` : ""}` : d.seconds ? `${d.seconds} s` : "";
  const main = d.sets && amount ? `${d.sets} × ${amount}` : amount || (d.sets ? `${d.sets} series` : "");
  return [
    main,
    d.perSide ? "cada lado" : "",
    withRest && d.restSeconds ? `descanso ${d.restSeconds} s` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

// The bank's default dose, as a new item of a tabla or program
export const itemFromExercise = (e: Exercise): ListItemInput => ({
  exerciseId: e.id,
  sets: e.defaultSets,
  reps: e.defaultReps,
  seconds: e.defaultSeconds,
  restSeconds: e.defaultRestSeconds,
  perSide: e.perSide,
  notes: null,
  videoUrl: e.videoUrl,
});

// Lowercase and without accents, so "rodilla" finds "Rodilla" and "gluteo" "glúteo"
export const plain = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Photos from a phone are big: resized to at most 1200 px and saved as JPEG
// before uploading (the backend accepts up to 2 MB)
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d")!;
  // White behind transparent PNGs (JPEG has no transparency)
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo leer la imagen"))), "image/jpeg", 0.82),
  );
}

// A quick check of a YouTube link while typing (the server checks it properly)
export const looksLikeYoutube = (value: string) =>
  /^(https?:\/\/)?((www|m)\.)?(youtube\.com\/(watch\?|shorts\/|embed\/|live\/)|youtu\.be\/)\S+$/i.test(value.trim());
