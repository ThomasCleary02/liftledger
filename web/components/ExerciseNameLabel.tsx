import { splitExerciseDisplay } from "@liftledger/shared/exerciseDisplay";

export function ExerciseNameLabel({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { title, tag } = splitExerciseDisplay(name);
  return (
    <span className={className}>
      {title}
      {tag ? (
        <span className="ml-2 inline-flex align-middle rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {tag}
        </span>
      ) : null}
    </span>
  );
}
