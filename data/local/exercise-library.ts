import { EXERCISE_DB_EXERCISES, type ExerciseDbExercise } from '@/data/local/exercisedb.generated';
import { EXERCISE_DB_IMAGE_ASSETS } from '@/data/local/exercisedb-image-assets.generated';
import type { ExerciseLibraryEntry, WorkoutTrackingMode } from '@/types/app-data';

const EXERCISE_DB_ALIASES_BY_NAME: Record<string, string[]> = {
  'barbell bent over row': ['Barbell Row', 'Chest Supported Row'],
  'barbell full squat': ['Barbell Back Squat', 'Back Squat', 'Barbell Squat'],
  'barbell incline bench press': ['Incline Barbell Press'],
  'barbell romanian deadlift': ['Romanian Deadlift'],
  'cable one arm incline press': ['Incline Dumbbell Press'],
  'cable one arm incline press on exercise ball': ['Incline Dumbbell Press'],
  'cable pushdown': ['Tricep Pressdown', 'Triceps Pressdown'],
  'cable pushdown with rope attachment': ['Tricep Pressdown', 'Triceps Pressdown'],
  'cable rear delt row with rope': ['Face Pull'],
  'cable rear delt row stirrups': ['Face Pull'],
  'cable standing rear delt row with rope': ['Face Pull'],
  'cable lat pulldown full range of motion': ['Lat Pulldown'],
  'cable lateral raise': ['Lateral Raise'],
  'dumbbell bench press': ['Incline Dumbbell Press'],
  'dumbbell incline press on exercise ball': ['Incline Dumbbell Press'],
  'dumbbell hammer curl': ['Hammer Curl'],
  'dumbbell lateral raise': ['Lateral Raise'],
  'dumbbell seated shoulder press': ['Seated Shoulder Press'],
  'ez barbell reverse grip preacher curl': ['EZ Bar Curl'],
  'lever seated leg curl': ['Hamstring Curl', 'Leg Curl'],
  'smith seated shoulder press': ['Machine Shoulder Press'],
  'sled 45 leg press': ['Leg Press'],
  'sled 45 leg press back pov': ['Leg Press'],
  'sled 45 leg press side pov': ['Leg Press'],
  'split squats': ['Bulgarian Split Squat'],
  'triceps pushdown': ['Tricep Pressdown', 'Triceps Pressdown'],
  'weighted pull-up': ['Weighted Pull Up'],
};

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function titleize(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

function deriveFocus(exercise: ExerciseDbExercise) {
  return exercise.target ? titleize(exercise.target) : exercise.bodyPart ? titleize(exercise.bodyPart) : 'Custom';
}

function toExerciseLibraryEntry(exercise: ExerciseDbExercise): ExerciseLibraryEntry {
  return {
    aliases: EXERCISE_DB_ALIASES_BY_NAME[normalizeSearchValue(exercise.name)] ?? [],
    bodyPart: exercise.bodyPart ?? null,
    category: exercise.category ?? null,
    description: exercise.description ?? null,
    difficulty: exercise.difficulty ?? null,
    equipment: exercise.equipment ?? null,
    force: null,
    focus: deriveFocus(exercise),
    id: `exdb:${exercise.id}`,
    imageAssetId: exercise.imageAssetId,
    imageUrls: [],
    instructions: exercise.instructions ?? [],
    level: exercise.difficulty ?? null,
    mechanic: null,
    name: titleize(exercise.name),
    primaryMuscles: exercise.target ? [titleize(exercise.target)] : [],
    secondaryMuscles: exercise.secondaryMuscles.map(titleize),
    source: 'exercise-db',
    target: exercise.target ? titleize(exercise.target) : null,
  };
}

export const EXERCISE_DB_LIBRARY: ExerciseLibraryEntry[] = EXERCISE_DB_EXERCISES.map(
  toExerciseLibraryEntry,
).sort((left, right) => left.name.localeCompare(right.name));

export function getExerciseLibraryImageSource(exercise: ExerciseLibraryEntry) {
  if (exercise.imageAssetId && exercise.imageAssetId in EXERCISE_DB_IMAGE_ASSETS) {
    return EXERCISE_DB_IMAGE_ASSETS[
      exercise.imageAssetId as keyof typeof EXERCISE_DB_IMAGE_ASSETS
    ];
  }

  if (exercise.imageUrls[0]) {
    return { uri: exercise.imageUrls[0] };
  }

  return null;
}

export function searchExerciseLibraryEntry(entry: ExerciseLibraryEntry, query: string) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchableParts = [
    entry.name,
    ...entry.aliases,
    entry.focus,
    entry.bodyPart ?? '',
    entry.category ?? '',
    entry.equipment ?? '',
    entry.force ?? '',
    entry.target ?? '',
    ...entry.primaryMuscles,
    ...entry.secondaryMuscles,
  ];

  return searchableParts.some((part) =>
    normalizeSearchValue(part).includes(normalizedQuery),
  );
}

export function inferExerciseTrackingMode(
  exercise: Pick<ExerciseLibraryEntry, 'bodyPart' | 'category' | 'equipment' | 'focus' | 'name'>,
): WorkoutTrackingMode {
  const bodyPart = normalizeSearchValue(exercise.bodyPart ?? '');
  const category = normalizeSearchValue(exercise.category ?? '');
  const equipment = normalizeSearchValue(exercise.equipment ?? '');
  const focus = normalizeSearchValue(exercise.focus);
  const name = normalizeSearchValue(exercise.name);

  if (
    bodyPart === 'cardio' ||
    category === 'cardio' ||
    focus.includes('cardio') ||
    equipment.includes('cardio') ||
    name.includes('run') ||
    name.includes('walk') ||
    name.includes('bike') ||
    name.includes('rower') ||
    name.includes('elliptical') ||
    name.includes('aerobics') ||
    name.includes('jump rope')
  ) {
    return 'duration';
  }

  return 'strength';
}

export function buildSeededExerciseLibrary(
  _seedExercises: Array<{ name: string; focus: string }>,
) {
  return EXERCISE_DB_LIBRARY;
}

export function mergeExerciseLibrary(
  candidateEntries: ExerciseLibraryEntry[] | undefined,
  seedEntries: ExerciseLibraryEntry[],
) {
  if (!candidateEntries?.length) {
    return seedEntries;
  }

  const mergedByName = new Map<string, ExerciseLibraryEntry>();

  seedEntries.forEach((entry) => {
    mergedByName.set(normalizeSearchValue(entry.name), entry);
  });

  candidateEntries.forEach((entry) => {
    if (entry.source === 'seed' || (entry.source as string) === 'free-exercise-db') {
      return;
    }

    const normalizedName = normalizeSearchValue(entry.name);
    const matchingSeedEntry = mergedByName.get(normalizedName);

    if (!matchingSeedEntry) {
      mergedByName.set(normalizedName, {
        aliases: entry.aliases ?? [],
        bodyPart: entry.bodyPart ?? null,
        category: entry.category ?? null,
        description: entry.description ?? null,
        difficulty: entry.difficulty ?? null,
        equipment: entry.equipment ?? null,
        force: entry.force ?? null,
        focus: entry.focus,
        id: entry.id,
        imageAssetId: entry.imageAssetId ?? null,
        imageUrls: entry.imageUrls ?? [],
        instructions: entry.instructions ?? [],
        level: entry.level ?? null,
        mechanic: entry.mechanic ?? null,
        name: entry.name,
        primaryMuscles: entry.primaryMuscles ?? [],
        secondaryMuscles: entry.secondaryMuscles ?? [],
        source: entry.source ?? 'custom',
        target: entry.target ?? null,
      });
      return;
    }

    mergedByName.set(normalizedName, {
      ...matchingSeedEntry,
      aliases: [...new Set([...(matchingSeedEntry.aliases ?? []), ...(entry.aliases ?? [])])],
      bodyPart: entry.bodyPart ?? matchingSeedEntry.bodyPart,
      category: entry.category ?? matchingSeedEntry.category,
      description: entry.description ?? matchingSeedEntry.description,
      difficulty: entry.difficulty ?? matchingSeedEntry.difficulty,
      equipment: entry.equipment ?? matchingSeedEntry.equipment,
      focus: entry.focus || matchingSeedEntry.focus,
      id: matchingSeedEntry.id,
      imageAssetId: entry.imageAssetId ?? matchingSeedEntry.imageAssetId,
      imageUrls: entry.imageUrls?.length ? entry.imageUrls : matchingSeedEntry.imageUrls,
      instructions: entry.instructions?.length ? entry.instructions : matchingSeedEntry.instructions,
      level: entry.level ?? matchingSeedEntry.level,
      mechanic: entry.mechanic ?? matchingSeedEntry.mechanic,
      primaryMuscles: entry.primaryMuscles?.length
        ? entry.primaryMuscles
        : matchingSeedEntry.primaryMuscles,
      secondaryMuscles: entry.secondaryMuscles?.length
        ? entry.secondaryMuscles
        : matchingSeedEntry.secondaryMuscles,
      source: matchingSeedEntry.source,
      target: entry.target ?? matchingSeedEntry.target,
    });
  });

  return [...mergedByName.values()].sort((left, right) => left.name.localeCompare(right.name));
}
