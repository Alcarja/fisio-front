import { Dumbbell } from "lucide-react";
import { getExerciseImage, type Exercise } from "@/adapters/api";
import AuthImage from "@/components/AuthImage";
import { cn } from "@/lib/utils";

// An exercise's image, or a placeholder while it has none
export default function ExerciseThumb({ exercise, className }: { exercise: Exercise; className?: string }) {
  if (!exercise.hasImage) {
    return (
      <span className={cn("flex items-center justify-center rounded-lg bg-secondary text-primary/60", className)}>
        <Dumbbell className="size-5" />
      </span>
    );
  }
  return (
    <AuthImage
      load={() => getExerciseImage(exercise.id, exercise.updatedAt)}
      version={exercise.updatedAt}
      alt={exercise.name}
      className={cn("rounded-lg", className)}
    />
  );
}
