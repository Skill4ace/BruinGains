export type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'lateNight';

export type MealLogPeriod = MealPeriod | 'snack';

export type PublicDiningHallHours = Record<MealPeriod, string | null>;

export type PublicDiningHall = {
  id: string;
  name: string;
  fitPercent: number;
  hours: PublicDiningHallHours;
};

export type GymCapacitySnapshot = {
  id: string;
  name: string;
  hours: string;
  load: number;
  percent: number;
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
};

export type ExerciseLibraryEntry = {
  id: string;
  name: string;
  focus: string;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  focus: string;
  createdAt: string;
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
  order: number;
};

export type WorkoutSet = {
  id: string;
  sessionId: string;
  sessionExerciseId: string;
  load: number;
  reps: number;
  loggedAt: string;
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
  repRange: string;
  previousLoadLabel: string;
  currentLoad: number;
  targetReps: number;
  active: boolean;
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
