export type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'lateNight';

export type MealLogPeriod = MealPeriod | 'snack';

export type PublicDiningHallHours = Record<MealPeriod, string | null>;

export type PublicDiningHall = {
  id: string;
  name: string;
  fitPercent: number | null;
  hours: PublicDiningHallHours;
};

export type GymCapacitySnapshot = {
  id: string;
  name: string;
  hours: string;
  isClosed: boolean;
  load: number;
  percent: number;
  zoneName: string | null;
  capturedAt: string;
};

export type LocalProfile = {
  id: string;
  displayName: string;
  campusRole: string;
  primaryGoal: string;
};

export type GoalSettings = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  workoutsPerWeek: number;
};

export type MealLog = {
  id: string;
  title: string;
  period: MealLogPeriod;
  loggedAt: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  source: 'dining' | 'manual';
  hallId?: string;
  hallName?: string;
  recipeId?: number;
  servingSize?: string;
  servings?: number;
};

export type ExerciseLibraryEntry = {
  aliases: string[];
  bodyPart: string | null;
  category: string | null;
  description: string | null;
  difficulty: string | null;
  equipment: string | null;
  force: string | null;
  imageAssetId: string | null;
  imageUrls: string[];
  id: string;
  instructions: string[];
  level: string | null;
  mechanic: string | null;
  name: string;
  focus: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  source: 'custom' | 'exercise-db' | 'seed';
  target: string | null;
};

export type WorkoutTrackingMode = 'strength' | 'duration';
export type WorkoutSetType = 'drop' | 'failure' | 'normal' | 'warmup';

export type WorkoutExerciseDraft = {
  currentLoad?: number;
  name: string;
  repRange?: string;
  targetDurationMinutes?: number;
  targetReps?: number;
  targetSets: number;
  trackingMode: WorkoutTrackingMode;
};

export type WorkoutTemplateExerciseDraft = {
  defaultLoad: number;
  defaultReps: number;
  name: string;
  targetSets: number;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  createdAt: string;
  order: number;
  updatedAt: string;
};

export type WorkoutTemplateExercise = {
  id: string;
  templateId: string;
  name: string;
  targetSets: number;
  repRange: string;
  previousLoadLabel: string;
  defaultLoad: number;
  defaultReps: number;
  order: number;
};

export type WorkoutSession = {
  id: string;
  title: string;
  templateId: string | null;
  startedAt: string;
  endedAt: string | null;
  activeExerciseId: string | null;
  restDurationSeconds?: number | null;
  restStartedAt?: string | null;
};

export type WorkoutSessionExercise = {
  id: string;
  sessionId: string;
  templateExerciseId: string | null;
  name: string;
  targetSets: number;
  repRange: string;
  previousLoadLabel: string;
  currentLoad: number;
  targetReps: number;
  targetDurationMinutes?: number | null;
  trackingMode?: WorkoutTrackingMode;
  order: number;
};

export type WorkoutSet = {
  completed?: boolean;
  durationMinutes?: number | null;
  id: string;
  sessionId: string;
  sessionExerciseId: string;
  load: number;
  reps: number;
  loggedAt: string;
  setType?: WorkoutSetType;
  setNumber?: number;
};

export type PersonalRecord = {
  id: string;
  exerciseName: string;
  weight: number;
  reps: number;
  achievedAt: string;
};

export type Achievement = {
  id: string;
  title: string;
  detail: string;
  date: string;
  icon: string;
  tone: 'nutrition' | 'workout';
};

export type UserPreferences = {
  activeWorkoutSessionId: string | null;
  preferredDiningPeriod: MealPeriod;
  favoriteHallIds: string[];
};

export type LocalAppData = {
  profile: LocalProfile;
  goals: GoalSettings;
  mealLogs: MealLog[];
  exerciseLibrary: ExerciseLibraryEntry[];
  workoutTemplates: WorkoutTemplate[];
  templateExercises: WorkoutTemplateExercise[];
  workoutSessions: WorkoutSession[];
  workoutSessionExercises: WorkoutSessionExercise[];
  workoutSets: WorkoutSet[];
  personalRecords: PersonalRecord[];
  achievements: Achievement[];
  userPreferences: UserPreferences;
};

export type WorkoutTemplateSummary = WorkoutTemplate & {
  exerciseCount: number;
};

export type NutritionSummary = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type DiningNutritionFact = {
  id: string;
  label: string;
  value: string;
  dailyValuePercent: number | null;
};

export type DiningCustomizationOption = {
  recipeId: number | null;
  itemName: string;
  defaultQuantity: number;
  servingSize: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatsG: number | null;
  badgeLabels: string[];
  allergenLabels: string[];
  ingredients: string[];
  nutritionFacts: DiningNutritionFact[];
};

export type WeeklyActivityDay = {
  id: string;
  day: string;
  date: string;
  workout: boolean;
  nutrition: boolean;
};

export type WeeklyActivityCard = {
  id: string;
  startDate: string;
  label: string;
  days: WeeklyActivityDay[];
};

export type ActiveWorkoutExerciseView = {
  id: string;
  name: string;
  targetSets: number;
  completedSets: number;
  allSetsCompleted: boolean;
  repRange: string;
  previousLoadLabel: string;
  currentLoad: number;
  targetReps: number;
  targetDurationMinutes: number | null;
  trackingMode: WorkoutTrackingMode;
  active: boolean;
  order: number;
  sets: ActiveWorkoutSetView[];
};

export type ActiveWorkoutSetView = {
  completed: boolean;
  durationMinutes: number | null;
  id: string | null;
  load: number;
  reps: number;
  setNumber: number;
  setType: WorkoutSetType;
};

export type ActiveWorkoutSessionView = {
  session: WorkoutSession;
  exercises: ActiveWorkoutExerciseView[];
};

export type PublicResourceSource = 'fallback' | 'cache' | 'network';

export type PublicResourceState<T> = {
  data: T;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  source: PublicResourceSource;
  updatedAt: string | null;
};

export type DiningMenuItem = {
  hallId: string;
  hallName: string;
  hallSortOrder: number;
  serviceDate: string;
  mealPeriod: MealPeriod;
  snapshotStatus: string;
  fetchedAt: string;
  recipeId: number | null;
  stationName: string;
  itemName: string;
  servingSize: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatsG: number | null;
  itemOrder: number;
  badgeLabels: string[];
  allergenLabels: string[];
  ingredients: string[];
  nutritionFacts: DiningNutritionFact[];
  customizationOptions: DiningCustomizationOption[];
};

export type CreateCustomMealLogInput = {
  title: string;
  period: MealLogPeriod;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type CreateDiningMealLogInput = {
  item: DiningMenuItem;
  servings: number;
  nutritionOverride?: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatsG: number;
  };
  titleOverride?: string;
};

export type UpdateMealLogInput = {
  mealLogId: string;
  title: string;
  period: MealLogPeriod;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};
