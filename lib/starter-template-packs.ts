import type { WorkoutTemplateExerciseDraft } from '@/types/app-data';

export type StarterTemplatePackId =
  | 'full-body'
  | 'upper-lower'
  | 'push-pull-legs'
  | 'bro-split'
  | 'conditioning';

type StarterTemplateDefinition = {
  exercises: WorkoutTemplateExerciseDraft[];
  name: string;
};

export type StarterTemplatePack = {
  description: string;
  iconName: string;
  id: StarterTemplatePackId;
  subtitle: string;
  templateCount: number;
  title: string;
  templates: StarterTemplateDefinition[];
};

function strengthExercise(
  name: string,
  setCount: number,
  load: number,
  reps: number,
  repRange: string,
): WorkoutTemplateExerciseDraft {
  return {
    name,
    repRange,
    trackingMode: 'strength',
    sets: Array.from({ length: setCount }, (_, index) => ({
      load,
      reps,
      setNumber: index + 1,
      setType: 'normal',
    })),
  };
}

function durationExercise(
  name: string,
  durationMinutes: number,
): WorkoutTemplateExerciseDraft {
  return {
    name,
    repRange: `${durationMinutes} min`,
    targetDurationMinutes: durationMinutes,
    trackingMode: 'duration',
    sets: [
      {
        durationMinutes,
        load: 0,
        reps: 0,
        setNumber: 1,
        setType: 'normal',
      },
    ],
  };
}

export const STARTER_TEMPLATE_PACKS: StarterTemplatePack[] = [
  {
    id: 'full-body',
    title: 'Full Body',
    subtitle: 'Best for 2-3 days per week',
    description: 'Three balanced sessions that keep the whole week simple.',
    iconName: 'body-outline',
    templateCount: 3,
    templates: [
      {
        name: 'Full Body A',
        exercises: [
          strengthExercise('Barbell Back Squat', 4, 135, 5, '5-8 reps'),
          strengthExercise('Barbell Bench Press', 4, 115, 6, '5-8 reps'),
          strengthExercise('Lat Pulldown', 3, 100, 10, '8-12 reps'),
          strengthExercise('Dumbbell Romanian Deadlift', 3, 55, 10, '8-12 reps'),
          strengthExercise('Cable Curl', 3, 35, 12, '10-15 reps'),
        ],
      },
      {
        name: 'Full Body B',
        exercises: [
          strengthExercise('Leg Press', 4, 180, 10, '8-12 reps'),
          strengthExercise('Incline Dumbbell Press', 3, 45, 10, '8-12 reps'),
          strengthExercise('Seated Cable Row', 3, 100, 10, '8-12 reps'),
          strengthExercise('Dumbbell Shoulder Press', 3, 35, 10, '8-12 reps'),
          strengthExercise('Cable Pushdown', 3, 45, 12, '10-15 reps'),
        ],
      },
      {
        name: 'Full Body C',
        exercises: [
          strengthExercise('Romanian Deadlift', 4, 135, 8, '6-10 reps'),
          strengthExercise('Pull Up', 3, 0, 8, '6-10 reps'),
          strengthExercise('Chest Press Machine', 3, 90, 10, '8-12 reps'),
          strengthExercise('Leg Curl', 3, 70, 12, '10-15 reps'),
          strengthExercise('Lateral Raise', 3, 20, 15, '12-20 reps'),
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    title: 'Upper / Lower',
    subtitle: 'A clean 4-day split',
    description: 'Alternates upper and lower sessions with enough volume to progress.',
    iconName: 'barbell-outline',
    templateCount: 4,
    templates: [
      {
        name: 'Upper A',
        exercises: [
          strengthExercise('Barbell Bench Press', 4, 135, 6, '5-8 reps'),
          strengthExercise('Chest Supported Row', 4, 80, 8, '6-10 reps'),
          strengthExercise('Incline Dumbbell Press', 3, 50, 10, '8-12 reps'),
          strengthExercise('Lat Pulldown', 3, 110, 10, '8-12 reps'),
          strengthExercise('Cable Curl', 3, 35, 12, '10-15 reps'),
          strengthExercise('Cable Pushdown', 3, 45, 12, '10-15 reps'),
        ],
      },
      {
        name: 'Lower A',
        exercises: [
          strengthExercise('Barbell Back Squat', 4, 155, 5, '5-8 reps'),
          strengthExercise('Romanian Deadlift', 3, 145, 8, '6-10 reps'),
          strengthExercise('Leg Press', 3, 225, 12, '10-15 reps'),
          strengthExercise('Leg Curl', 3, 75, 12, '10-15 reps'),
          strengthExercise('Standing Calf Raise', 4, 100, 15, '12-20 reps'),
        ],
      },
      {
        name: 'Upper B',
        exercises: [
          strengthExercise('Pull Up', 4, 0, 8, '6-10 reps'),
          strengthExercise('Dumbbell Shoulder Press', 4, 40, 8, '6-10 reps'),
          strengthExercise('Seated Cable Row', 3, 110, 10, '8-12 reps'),
          strengthExercise('Machine Chest Press', 3, 95, 10, '8-12 reps'),
          strengthExercise('Lateral Raise', 3, 20, 15, '12-20 reps'),
          strengthExercise('Hammer Curl', 3, 25, 12, '10-15 reps'),
        ],
      },
      {
        name: 'Lower B',
        exercises: [
          strengthExercise('Deadlift', 3, 185, 5, '3-6 reps'),
          strengthExercise('Bulgarian Split Squat', 3, 35, 10, '8-12 reps'),
          strengthExercise('Leg Extension', 3, 85, 12, '10-15 reps'),
          strengthExercise('Seated Leg Curl', 3, 80, 12, '10-15 reps'),
          strengthExercise('Standing Calf Raise', 4, 110, 15, '12-20 reps'),
        ],
      },
    ],
  },
  {
    id: 'push-pull-legs',
    title: 'Push Pull Legs',
    subtitle: 'Great for 3 or 6 days per week',
    description: 'A classic split with focused sessions and easy repeatability.',
    iconName: 'fitness-outline',
    templateCount: 3,
    templates: [
      {
        name: 'Push',
        exercises: [
          strengthExercise('Barbell Bench Press', 4, 135, 6, '5-8 reps'),
          strengthExercise('Incline Dumbbell Press', 3, 50, 10, '8-12 reps'),
          strengthExercise('Dumbbell Shoulder Press', 3, 40, 8, '8-10 reps'),
          strengthExercise('Lateral Raise', 3, 20, 15, '12-20 reps'),
          strengthExercise('Cable Fly', 3, 25, 12, '10-15 reps'),
          strengthExercise('Cable Pushdown', 3, 50, 12, '10-15 reps'),
        ],
      },
      {
        name: 'Pull',
        exercises: [
          strengthExercise('Pull Up', 4, 0, 8, '6-10 reps'),
          strengthExercise('Barbell Row', 4, 135, 8, '6-10 reps'),
          strengthExercise('Lat Pulldown', 3, 110, 10, '8-12 reps'),
          strengthExercise('Seated Cable Row', 3, 110, 10, '8-12 reps'),
          strengthExercise('Face Pull', 3, 35, 15, '12-20 reps'),
          strengthExercise('Hammer Curl', 3, 25, 12, '10-15 reps'),
        ],
      },
      {
        name: 'Legs',
        exercises: [
          strengthExercise('Barbell Back Squat', 4, 165, 5, '5-8 reps'),
          strengthExercise('Leg Press', 3, 270, 12, '10-15 reps'),
          strengthExercise('Romanian Deadlift', 3, 155, 8, '6-10 reps'),
          strengthExercise('Seated Leg Curl', 3, 80, 12, '10-15 reps'),
          strengthExercise('Walking Lunge', 3, 30, 10, '8-12 reps'),
          strengthExercise('Standing Calf Raise', 4, 110, 15, '12-20 reps'),
        ],
      },
    ],
  },
  {
    id: 'bro-split',
    title: 'Bro Split',
    subtitle: 'Five focused body-part days',
    description: 'Classic single-focus sessions for lifters who want more isolation work.',
    iconName: 'flame-outline',
    templateCount: 5,
    templates: [
      {
        name: 'Chest',
        exercises: [
          strengthExercise('Barbell Bench Press', 4, 135, 6, '5-8 reps'),
          strengthExercise('Incline Dumbbell Press', 4, 50, 10, '8-12 reps'),
          strengthExercise('Machine Chest Press', 3, 95, 10, '8-12 reps'),
          strengthExercise('Cable Fly', 3, 25, 15, '12-20 reps'),
        ],
      },
      {
        name: 'Back',
        exercises: [
          strengthExercise('Pull Up', 4, 0, 8, '6-10 reps'),
          strengthExercise('Barbell Row', 4, 135, 8, '6-10 reps'),
          strengthExercise('Lat Pulldown', 3, 110, 10, '8-12 reps'),
          strengthExercise('Seated Cable Row', 3, 110, 10, '8-12 reps'),
        ],
      },
      {
        name: 'Legs',
        exercises: [
          strengthExercise('Barbell Back Squat', 4, 165, 5, '5-8 reps'),
          strengthExercise('Leg Press', 4, 270, 12, '10-15 reps'),
          strengthExercise('Romanian Deadlift', 3, 155, 8, '6-10 reps'),
          strengthExercise('Leg Curl', 3, 75, 12, '10-15 reps'),
        ],
      },
      {
        name: 'Shoulders',
        exercises: [
          strengthExercise('Dumbbell Shoulder Press', 4, 40, 8, '6-10 reps'),
          strengthExercise('Lateral Raise', 4, 20, 15, '12-20 reps'),
          strengthExercise('Reverse Pec Deck', 3, 55, 15, '12-20 reps'),
          strengthExercise('Face Pull', 3, 35, 15, '12-20 reps'),
        ],
      },
      {
        name: 'Arms',
        exercises: [
          strengthExercise('Cable Curl', 4, 35, 12, '10-15 reps'),
          strengthExercise('Hammer Curl', 3, 25, 12, '10-15 reps'),
          strengthExercise('Cable Pushdown', 4, 50, 12, '10-15 reps'),
          strengthExercise('Overhead Cable Extension', 3, 35, 12, '10-15 reps'),
        ],
      },
    ],
  },
  {
    id: 'conditioning',
    title: 'Cardio / Conditioning',
    subtitle: 'Simple conditioning add-on',
    description: 'Short cardio templates you can layer onto any lifting split.',
    iconName: 'heart-outline',
    templateCount: 3,
    templates: [
      {
        name: 'Zone 2',
        exercises: [durationExercise('Zone 2 Cardio', 35)],
      },
      {
        name: 'Intervals',
        exercises: [durationExercise('Intervals', 20)],
      },
      {
        name: 'Incline Walk',
        exercises: [durationExercise('Incline Walk', 25)],
      },
    ],
  },
];

export function getStarterTemplatePack(packId: StarterTemplatePackId) {
  return STARTER_TEMPLATE_PACKS.find((pack) => pack.id === packId) ?? null;
}

export function getRecommendedStarterPackId(
  workoutsPerWeek: number | null,
): StarterTemplatePackId | null {
  if (!workoutsPerWeek) {
    return null;
  }

  if (workoutsPerWeek <= 2) {
    return 'full-body';
  }

  if (workoutsPerWeek <= 4) {
    return 'upper-lower';
  }

  return 'push-pull-legs';
}
