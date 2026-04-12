import type {
  GoalSettings,
  ProfileActivityLevel,
  ProfileNutritionGoal,
  ProfileSex,
  UpdateGoalPlanInput,
  WorkoutSplitPreset,
} from '@/types/app-data';

type GoalCalculatorInput = Pick<
  UpdateGoalPlanInput,
  'age' | 'activityLevel' | 'heightInches' | 'nutritionGoal' | 'sex' | 'weightPounds'
>;

export const ACTIVITY_LEVEL_OPTIONS: {
  label: string;
  value: ProfileActivityLevel;
}[] = [
  { label: 'Sedentary', value: 'sedentary' },
  { label: 'Light', value: 'light' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'High', value: 'high' },
  { label: 'Very high', value: 'very_high' },
];

export const NUTRITION_GOAL_OPTIONS: {
  label: string;
  value: ProfileNutritionGoal;
}[] = [
  { label: 'Cut', value: 'cut' },
  { label: 'Maintain', value: 'maintain' },
  { label: 'Lean bulk', value: 'lean_bulk' },
  { label: 'Bulk', value: 'bulk' },
];

export const SEX_OPTIONS: {
  label: string;
  value: ProfileSex;
}[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

export const WORKOUT_SPLIT_OPTIONS: {
  label: string;
  value: WorkoutSplitPreset;
  workoutsPerWeek: number | null;
}[] = [
  { label: 'Custom', value: 'custom', workoutsPerWeek: null },
  { label: '3-Day Full Body', value: 'full_body_3', workoutsPerWeek: 3 },
  { label: '4-Day Upper/Lower', value: 'upper_lower_4', workoutsPerWeek: 4 },
  { label: '5-Day PPL', value: 'push_pull_legs_5', workoutsPerWeek: 5 },
  { label: '6-Day PPL', value: 'push_pull_legs_6', workoutsPerWeek: 6 },
  { label: '5-Day Body Part', value: 'body_part_5', workoutsPerWeek: 5 },
];

const ACTIVITY_MULTIPLIERS: Record<ProfileActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  very_high: 1.9,
};

const CALORIE_ADJUSTMENTS: Record<ProfileNutritionGoal, number> = {
  cut: -450,
  maintain: 0,
  lean_bulk: 250,
  bulk: 400,
};

const PROTEIN_MULTIPLIERS: Record<ProfileNutritionGoal, number> = {
  cut: 1,
  maintain: 0.95,
  lean_bulk: 0.9,
  bulk: 0.85,
};

const FAT_MULTIPLIERS: Record<ProfileNutritionGoal, number> = {
  cut: 0.3,
  maintain: 0.35,
  lean_bulk: 0.35,
  bulk: 0.4,
};

function roundToNearestFive(value: number) {
  return Math.max(0, Math.round(value / 5) * 5);
}

export function getWorkoutsPerWeekForSplit(split: WorkoutSplitPreset) {
  return WORKOUT_SPLIT_OPTIONS.find((option) => option.value === split)?.workoutsPerWeek ?? null;
}

export function calculateGoalTargets(input: GoalCalculatorInput): GoalSettings {
  const weightPounds = Math.max(80, input.weightPounds);
  const heightInches = Math.max(48, input.heightInches);
  const age = Math.max(13, input.age);
  const weightKg = weightPounds * 0.45359237;
  const heightCm = heightInches * 2.54;
  const sexOffset = input.sex === 'male' ? 5 : -161;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset;
  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel];
  const calories = roundToNearestFive(tdee + CALORIE_ADJUSTMENTS[input.nutritionGoal]);
  const protein = Math.max(100, roundToNearestFive(weightPounds * PROTEIN_MULTIPLIERS[input.nutritionGoal]));
  let fats = Math.max(40, roundToNearestFive(weightPounds * FAT_MULTIPLIERS[input.nutritionGoal]));
  let carbs = Math.floor((calories - protein * 4 - fats * 9) / 4);

  if (carbs < 80) {
    fats = Math.max(35, roundToNearestFive((calories - protein * 4 - 80 * 4) / 9));
    carbs = Math.max(80, Math.floor((calories - protein * 4 - fats * 9) / 4));
  }

  return {
    calories,
    protein,
    carbs: Math.max(80, roundToNearestFive(carbs)),
    fats,
    workoutsPerWeek: 4,
  };
}
