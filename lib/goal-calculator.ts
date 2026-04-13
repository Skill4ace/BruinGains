import type {
  GoalSettings,
  ProfileActivityLevel,
  ProfileNutritionGoal,
  ProfileSex,
  UpdateGoalPlanInput,
} from '@/types/app-data';

type GoalCalculatorInput = Pick<
  UpdateGoalPlanInput,
  'age' | 'activityLevel' | 'heightInches' | 'nutritionGoal' | 'sex' | 'weightPounds'
>;

export const ACTIVITY_LEVEL_OPTIONS: {
  description: string;
  label: string;
  value: ProfileActivityLevel;
}[] = [
  {
    description: 'Mostly sitting, with limited walking or training.',
    label: 'Inactive',
    value: 'inactive',
  },
  {
    description: 'Some walking or training, but not daily hard exercise.',
    label: 'Low',
    value: 'low_active',
  },
  {
    description: 'Regular movement and purposeful activity most days.',
    label: 'Active',
    value: 'active',
  },
  {
    description: 'Very active daily routine or consistently high training load.',
    label: 'Very active',
    value: 'very_active',
  },
];

export const NUTRITION_GOAL_OPTIONS: {
  description: string;
  label: string;
  value: ProfileNutritionGoal;
}[] = [
  {
    description: 'Moderate calorie deficit.',
    label: 'Cut',
    value: 'cut',
  },
  {
    description: 'Maintain current weight.',
    label: 'Maintain',
    value: 'maintain',
  },
  {
    description: 'Small calorie surplus.',
    label: 'Lean bulk',
    value: 'lean_bulk',
  },
  {
    description: 'Larger calorie surplus.',
    label: 'Bulk',
    value: 'bulk',
  },
];

export const SEX_OPTIONS: {
  label: string;
  value: ProfileSex;
}[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

export const WORKOUTS_PER_WEEK_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

const ACTIVITY_MULTIPLIERS: Record<ProfileActivityLevel, number> = {
  inactive: 1.2,
  low_active: 1.375,
  active: 1.55,
  very_active: 1.725,
};

const CALORIE_ADJUSTMENTS: Record<ProfileNutritionGoal, number> = {
  cut: -500,
  maintain: 0,
  lean_bulk: 250,
  bulk: 400,
};

const PROTEIN_GRAMS_PER_POUND: Record<ProfileNutritionGoal, number> = {
  cut: 0.9,
  maintain: 0.85,
  lean_bulk: 0.8,
  bulk: 0.75,
};

const FAT_TARGET_PERCENT: Record<ProfileNutritionGoal, number> = {
  cut: 0.25,
  maintain: 0.275,
  lean_bulk: 0.25,
  bulk: 0.25,
};

function roundToNearestFive(value: number) {
  return Math.max(0, Math.round(value / 5) * 5);
}

function getMifflinStJeorBmr({
  age,
  heightCm,
  sex,
  weightKg,
}: {
  age: number;
  heightCm: number;
  sex: ProfileSex;
  weightKg: number;
}) {
  // Use the midpoint between the standard male/female offsets when the user
  // selects "Other" so target generation stays available without forcing a
  // binary selection.
  const sexOffset = sex === 'male' ? 5 : sex === 'female' ? -161 : -78;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset;
}

export function calculateGoalTargets(input: GoalCalculatorInput): GoalSettings {
  const age = Math.max(19, input.age);
  const weightPounds = Math.max(80, input.weightPounds);
  const heightCm = Math.max(48, input.heightInches) * 2.54;
  const weightKg = weightPounds * 0.45359237;
  const bmr = getMifflinStJeorBmr({
    age,
    heightCm,
    sex: input.sex,
    weightKg,
  });
  const maintenanceCalories = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel];
  const calories = roundToNearestFive(
    maintenanceCalories + CALORIE_ADJUSTMENTS[input.nutritionGoal],
  );
  let protein = roundToNearestFive(
    Math.max(110, weightPounds * PROTEIN_GRAMS_PER_POUND[input.nutritionGoal]),
  );
  let fats = roundToNearestFive(
    Math.max(45, (calories * FAT_TARGET_PERCENT[input.nutritionGoal]) / 9),
  );
  let carbs = roundToNearestFive((calories - protein * 4 - fats * 9) / 4);

  if (carbs < 100) {
    fats = roundToNearestFive(Math.max(40, fats - 10));
    carbs = roundToNearestFive((calories - protein * 4 - fats * 9) / 4);
  }

  if (carbs < 100) {
    protein = roundToNearestFive(Math.max(100, protein - 10));
    carbs = roundToNearestFive((calories - protein * 4 - fats * 9) / 4);
  }

  return {
    calories,
    protein,
    carbs: Math.max(100, carbs),
    fats,
    workoutsPerWeek: 4,
  };
}
