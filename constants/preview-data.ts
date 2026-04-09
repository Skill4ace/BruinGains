export const diningPreview = {
  calories: 1840,
  calorieGoal: 2400,
  protein: 138,
  carbs: 192,
  fats: 58,
  halls: [
    {
      id: 'epicuria',
      name: 'Epicuria',
      subtitle: 'Mediterranean Focus',
      avgCalories: 480,
      accent: '#2774AE',
      badge: 'Freshest today',
      menu: [
        { id: 'ep-1', name: 'Harissa Chicken Bowl', station: 'Mediterranean', calories: 520 },
        { id: 'ep-2', name: 'Lemon Herb Salmon', station: 'Chef Table', calories: 460 },
        { id: 'ep-3', name: 'Citrus Couscous Plate', station: 'Plant Forward', calories: 380 },
      ],
    },
    {
      id: 'bruin-plate',
      name: 'Bruin Plate',
      subtitle: 'Clean & Sustainable',
      avgCalories: 320,
      accent: '#0AAE8A',
      badge: 'Best macro split',
      menu: [
        { id: 'bp-1', name: 'Turkey Chili Bowl', station: 'Fuel', calories: 340 },
        { id: 'bp-2', name: 'Grilled Tofu Greens', station: 'Harvest', calories: 280 },
        { id: 'bp-3', name: 'Greek Yogurt Parfait', station: 'Breakfast', calories: 260 },
      ],
    },
    {
      id: 'de-neve',
      name: 'De Neve',
      subtitle: 'American Comfort',
      avgCalories: 610,
      accent: '#F26B5B',
      badge: 'Heaviest hitter',
      menu: [
        { id: 'dn-1', name: 'Stacked Burger Melt', station: 'Grill', calories: 710 },
        { id: 'dn-2', name: 'Chicken Alfredo Bake', station: 'Homestyle', calories: 640 },
        { id: 'dn-3', name: 'Loaded Breakfast Burrito', station: 'Brunch', calories: 590 },
      ],
    },
  ],
  recommendations: [
    { id: 'r-1', title: 'Protein-first move', body: 'Epicuria gives you the cleanest path to 160g today without blowing fats.' },
    { id: 'r-2', title: 'Post-lift option', body: 'Bruin Plate keeps dinner lighter if you start a heavier workout session later.' },
  ],
  recentMeals: [
    { id: 'm-1', title: 'Protein oats', meta: 'Breakfast', calories: 420 },
    { id: 'm-2', title: 'Chicken rice bowl', meta: 'Lunch', calories: 610 },
    { id: 'm-3', title: 'Greek yogurt', meta: 'Snack', calories: 190 },
  ],
} as const;

export const gymPreview = {
  weekStrip: [
    { id: 'mon', label: 'M', active: true },
    { id: 'tue', label: 'T', active: true },
    { id: 'wed', label: 'W', active: true },
    { id: 'thu', label: 'T', active: true, highlighted: true },
    { id: 'fri', label: 'F' },
    { id: 'sat', label: 'S' },
    { id: 'sun', label: 'S' },
  ],
  capacities: [
    {
      id: 'wooden',
      name: 'Wooden Center',
      status: 'Open until 11PM',
      load: 0.82,
      percent: 82,
      tone: 'blue' as const,
    },
    {
      id: 'bfit',
      name: 'BFit Gym',
      status: 'Busy right now',
      load: 0.94,
      percent: 94,
      tone: 'gold' as const,
    },
  ],
  templates: ['Push Day', 'Leg Day', 'Pull', 'Upper'],
  exercises: [
    {
      id: 'ex-1',
      name: 'Bulgarian Split Squat',
      sets: '4 sets',
      repRange: '8-10 reps',
      previous: '95 lbs',
      current: '105',
      reps: '10',
      active: true,
    },
    {
      id: 'ex-2',
      name: 'Barbell Back Squat',
      sets: '4 sets',
      repRange: '6-8 reps',
      previous: '205 lbs',
      current: '225',
      reps: '8',
      active: false,
    },
    {
      id: 'ex-3',
      name: 'Leg Press',
      sets: '3 sets',
      repRange: '12 reps',
      previous: '360 lbs',
      current: '405',
      reps: '12',
      active: false,
    },
  ],
  totalVolume: 12450,
  weeklyGoalProgress: 0.78,
} as const;

export const profilePreview = {
  summary: [
    { id: 'workouts', label: 'Workouts', value: '5' },
    { id: 'calories', label: 'Avg calories', value: '2,210' },
    { id: 'protein', label: 'Avg protein', value: '154g' },
  ],
  prs: [
    { id: 'pr-1', title: 'Bench Press', value: '225 lbs', note: 'Latest PR' },
    { id: 'pr-2', title: 'Trap Bar Deadlift', value: '375 lbs', note: 'All-time best' },
  ],
  goals: {
    calories: '2,400 kcal target',
    protein: '160g daily target',
  },
  templates: [
    { id: 't-1', title: 'Push Day', detail: 'Chest, shoulders, triceps' },
    { id: 't-2', title: 'Leg Day', detail: 'Squat, hinge, calves' },
    { id: 't-3', title: 'Upper Pull', detail: 'Back, rear delts, biceps' },
  ],
  diningPreferences: ['Epicuria', 'Bruin Plate', 'High protein'],
} as const;
