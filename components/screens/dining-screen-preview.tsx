import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { type ReactNode, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDiningHallImageSource } from '@/data/public/campus-fallbacks';
import {
  formatMealLogMeta,
  getMealLogsForDate,
  getNutritionSummaryForDate,
} from '@/data/local/selectors';
import {
  useDiningHalls,
  useDiningMenuItems,
} from '@/hooks/use-campus-data';
import { useAppData } from '@/providers/app-data-provider';
import { ActionButton } from '@/components/ui/action-button';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { ProgressRing } from '@/components/ui/progress-ring';
import { SurfaceCard } from '@/components/ui/surface-card';
import { AppColors, Layout, Radii, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/providers/theme-provider';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import type {
  CreateDiningMealLogInput,
  DiningCustomizationOption,
  DiningMenuItem,
  DiningNutritionFact,
  MealLog,
  MealLogPeriod,
  MealPeriod,
  PublicDiningHall,
} from '@/types/app-data';

const PERIODS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'lateNight', label: 'Late Night' },
] as const;

const CUSTOM_MEAL_PERIODS = [
  ...PERIODS,
  { key: 'snack', label: 'Snack' },
] as const;

const DINING_HALL_PRIORITY = ['bruin-plate', 'de-neve', 'epicuria-covel'] as const;
const UCLA_BADGE_ICON_BASE_URL = 'https://dining.ucla.edu/wp-content/uploads/2025/05';

type PeriodKey = (typeof PERIODS)[number]['key'];
type MenuItemTotals = {
  calories: number;
  carbs: number | null;
  fats: number | null;
  protein: number | null;
};

type CustomMealDraft = {
  id?: string;
  title: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  period: MealLogPeriod;
};

type DiningMenuSection = {
  stationName: string;
  items: DiningMenuItem[];
};

const MACRO_META = {
  protein: { key: 'protein', color: '#E76F6A' },
  carbs: { key: 'carbs', color: '#E2A061' },
  fats: { key: 'fats', color: '#5B8EE6' },
} as const;

const OFFICIAL_BADGE_ICON_MAP = {
  alcohol: `${UCLA_BADGE_ICON_BASE_URL}/alcohol.png`,
  customizable: `${UCLA_BADGE_ICON_BASE_URL}/customizable.png`,
  crustacean: `${UCLA_BADGE_ICON_BASE_URL}/crustacean-shellfish2.png`,
  dairy: `${UCLA_BADGE_ICON_BASE_URL}/dairy.png`,
  egg: `${UCLA_BADGE_ICON_BASE_URL}/eggs.png`,
  fish: `${UCLA_BADGE_ICON_BASE_URL}/fish.png`,
  gluten: `${UCLA_BADGE_ICON_BASE_URL}/gluten.png`,
  halal: `${UCLA_BADGE_ICON_BASE_URL}/halal.png`,
  highCarbon: `${UCLA_BADGE_ICON_BASE_URL}/high-carbon.png`,
  lowCarbon: `${UCLA_BADGE_ICON_BASE_URL}/low-carbon.png`,
  peanut: `${UCLA_BADGE_ICON_BASE_URL}/peanut.png`,
  sesame: `${UCLA_BADGE_ICON_BASE_URL}/sesame.png`,
  soy: `${UCLA_BADGE_ICON_BASE_URL}/soy.png`,
  treeNuts: `${UCLA_BADGE_ICON_BASE_URL}/tree-nuts.png`,
  vegan: `${UCLA_BADGE_ICON_BASE_URL}/vegan.png`,
  vegetarian: `${UCLA_BADGE_ICON_BASE_URL}/vegetarian.png`,
  wheat: `${UCLA_BADGE_ICON_BASE_URL}/wheat.png`,
} as const;

type BadgePresentation = {
  foregroundColor: string;
  iconFamily?: 'ion' | 'material';
  iconName?: string;
  imageUri?: string;
  text: string;
};

type DiningMealSaveOverrides = {
  nutritionOverride?: CreateDiningMealLogInput['nutritionOverride'];
  servings?: number;
  titleOverride?: string;
};

export function DiningScreenPreview() {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  const {
    addCustomMealLog,
    addDiningMealLog,
    deleteMealLog,
    setPreferredDiningPeriod,
    state,
    updateMealLog,
  } = useAppData();
  const diningHallState = useDiningHalls();
  const diningMenuState = useDiningMenuItems();
  const launchDiningPeriodRef = useRef<PeriodKey>(getLaunchDiningPeriod());
  const launchDiningPeriod = launchDiningPeriodRef.current;
  const hasSyncedLaunchDiningPeriodRef = useRef(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>(
    launchDiningPeriod,
  );
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(true);
  const [customMealOpen, setCustomMealOpen] = useState(false);
  const [customMealDraft, setCustomMealDraft] = useState<CustomMealDraft>(
    createCustomMealDraft(launchDiningPeriod),
  );
  const [editingMealLog, setEditingMealLog] = useState<MealLog | null>(null);
  const [activeHallId, setActiveHallId] = useState<string | null>(null);
  const [activeHallPeriod, setActiveHallPeriod] = useState<PeriodKey>(launchDiningPeriod);
  const [hallSearchQuery, setHallSearchQuery] = useState('');
  const [selectedMenuItem, setSelectedMenuItem] = useState<DiningMenuItem | null>(null);
  const [selectedServings, setSelectedServings] = useState(1);
  const deferredHallSearchQuery = useDeferredValue(hallSearchQuery.trim().toLowerCase());
  const nutritionSummary = getNutritionSummaryForDate(state);
  const todaysMeals = getMealLogsForDate(state);
  const latestServiceDateByHall = useMemo(() => {
    const latestByHall = new Map<string, string>();

    diningMenuState.data.forEach((item) => {
      const latestForHall = latestByHall.get(item.hallId);

      if (!latestForHall || item.serviceDate > latestForHall) {
        latestByHall.set(item.hallId, item.serviceDate);
      }
    });

    return latestByHall;
  }, [diningMenuState.data]);
  const latestGlobalServiceDate = useMemo(() => {
    return diningMenuState.data.reduce<string | null>((latestDate, item) => {
      if (!latestDate || item.serviceDate > latestDate) {
        return item.serviceDate;
      }

      return latestDate;
    }, null);
  }, [diningMenuState.data]);
  const availableHallIdsForPeriod = useMemo(() => {
    if (!latestGlobalServiceDate) {
      return new Set<string>();
    }

    return new Set(
      diningMenuState.data
        .filter(
          (item) =>
            item.serviceDate === latestGlobalServiceDate &&
            item.mealPeriod === selectedPeriod &&
            item.snapshotStatus === 'ready',
        )
        .map((item) => item.hallId),
    );
  }, [diningMenuState.data, latestGlobalServiceDate, selectedPeriod]);

  const hallsForPeriod = useMemo(() => {
    return diningHallState.data
      .filter((hall) => {
        if (!hall.hours[selectedPeriod]) {
          return false;
        }

        if (!diningMenuState.data.length || !latestGlobalServiceDate) {
          return true;
        }

        return availableHallIdsForPeriod.has(hall.id);
      })
      .sort((a, b) => {
        const aPriority = DINING_HALL_PRIORITY.indexOf(
          a.id as (typeof DINING_HALL_PRIORITY)[number],
        );
        const bPriority = DINING_HALL_PRIORITY.indexOf(
          b.id as (typeof DINING_HALL_PRIORITY)[number],
        );
        const normalizedAPriority =
          aPriority === -1 ? Number.MAX_SAFE_INTEGER : aPriority;
        const normalizedBPriority =
          bPriority === -1 ? Number.MAX_SAFE_INTEGER : bPriority;

        if (normalizedAPriority !== normalizedBPriority) {
          return normalizedAPriority - normalizedBPriority;
        }

        return a.name.localeCompare(b.name);
      });
  }, [
    availableHallIdsForPeriod,
    diningHallState.data,
    diningMenuState.data.length,
    latestGlobalServiceDate,
    selectedPeriod,
  ]);

  const activeHall = useMemo(
    () => diningHallState.data.find((hall) => hall.id === activeHallId) ?? null,
    [activeHallId, diningHallState.data],
  );

  const activeHallItems = useMemo(
    () => {
      if (!activeHallId) {
        return [];
      }

      const latestForHall = latestServiceDateByHall.get(activeHallId);
      const targetServiceDate = latestGlobalServiceDate ?? latestForHall;

      return diningMenuState.data.filter(
        (item) =>
          item.hallId === activeHallId &&
          (!targetServiceDate || item.serviceDate === targetServiceDate),
      );
    },
    [activeHallId, diningMenuState.data, latestGlobalServiceDate, latestServiceDateByHall],
  );

  const effectiveSelectedMenuItem = selectedMenuItem;

  const activeHallSections = useMemo(() => {
    const scopedItems = activeHallItems.filter((item) => {
      if (item.mealPeriod !== activeHallPeriod) {
        return false;
      }

      if (!deferredHallSearchQuery) {
        return true;
      }

      return matchesDiningMenuQuery(item, deferredHallSearchQuery);
    });

    const sections = new Map<string, DiningMenuItem[]>();

    scopedItems.forEach((item) => {
      const sectionItems = sections.get(item.stationName) ?? [];
      sectionItems.push(item);
      sections.set(item.stationName, sectionItems);
    });

    return [...sections.entries()].map(([stationName, items]) => ({
      stationName,
      items: items.sort((left, right) => left.itemOrder - right.itemOrder),
    }));
  }, [activeHallItems, activeHallPeriod, deferredHallSearchQuery]);

  const selectedItemTotals = useMemo<MenuItemTotals | null>(() => {
    if (!effectiveSelectedMenuItem) {
      return null;
    }

    return getMenuItemTotals(effectiveSelectedMenuItem, selectedServings);
  }, [effectiveSelectedMenuItem, selectedServings]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  useEffect(() => {
    if (hasSyncedLaunchDiningPeriodRef.current) {
      return;
    }

    hasSyncedLaunchDiningPeriodRef.current = true;

    if (state.userPreferences.preferredDiningPeriod !== launchDiningPeriod) {
      setPreferredDiningPeriod(launchDiningPeriod);
    }
  }, [
    launchDiningPeriod,
    setPreferredDiningPeriod,
    state.userPreferences.preferredDiningPeriod,
  ]);

  const handleSummaryToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSummaryCollapsed((currentValue) => !currentValue);
  };

  const handleCustomMealOpen = () => {
    setCustomMealDraft(createCustomMealDraft(selectedPeriod));
    setEditingMealLog(null);
    setCustomMealOpen(true);
  };

  const handleMealLogEdit = (mealLog: MealLog) => {
    setEditingMealLog(mealLog);
    setCustomMealDraft(createCustomMealDraft(mealLog.period, mealLog));
    setCustomMealOpen(true);
  };

  const handleCustomMealSave = () => {
    const title = customMealDraft.title.trim();
    const calories = parseMealNumber(customMealDraft.calories);
    const protein = parseMealNumber(customMealDraft.protein);
    const carbs = parseMealNumber(customMealDraft.carbs);
    const fats = parseMealNumber(customMealDraft.fats);

    if (!title) {
      Alert.alert('Meal title required', 'Add a short name for this custom meal.');
      return;
    }

    if (Number.isNaN(calories) || calories <= 0) {
      Alert.alert('Calories required', 'Enter a valid calorie amount.');
      return;
    }

    if (Number.isNaN(protein) || Number.isNaN(carbs) || Number.isNaN(fats)) {
      Alert.alert('Invalid macros', 'Protein, carbs, and fats must be valid numbers.');
      return;
    }

    if (editingMealLog) {
      updateMealLog({
        mealLogId: editingMealLog.id,
        title,
        period: customMealDraft.period,
        calories,
        protein,
        carbs,
        fats,
      });
    } else {
      addCustomMealLog({
        title,
        period: customMealDraft.period,
        calories,
        protein,
        carbs,
        fats,
      });
    }

    setCustomMealOpen(false);
    setEditingMealLog(null);
  };

  const handleMealLogDelete = () => {
    if (!editingMealLog) {
      return;
    }

    Alert.alert(
      'Delete meal?',
      `Remove ${editingMealLog.title} from today's log?`,
      [
        {
          style: 'cancel',
          text: 'Cancel',
        },
        {
          style: 'destructive',
          text: 'Delete',
          onPress: () => {
            deleteMealLog(editingMealLog.id);
            setCustomMealOpen(false);
            setEditingMealLog(null);
          },
        },
      ],
    );
  };

  const handleHallOpen = (hall: PublicDiningHall) => {
    setActiveHallId(hall.id);
    setActiveHallPeriod(selectedPeriod);
    setHallSearchQuery('');
    setSelectedMenuItem(null);
    setSelectedServings(1);
  };

  const handleDiningItemSave = (overrides?: DiningMealSaveOverrides) => {
    if (!selectedMenuItem) {
      return;
    }

    addDiningMealLog({
      item: effectiveSelectedMenuItem ?? selectedMenuItem,
      servings: overrides?.servings ?? selectedServings,
      nutritionOverride: overrides?.nutritionOverride,
      titleOverride: overrides?.titleOverride,
    });
    setSelectedMenuItem(null);
    setSelectedServings(1);
  };

  return (
    <>
      <AppScreen contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText variant="headline">Dining</AppText>
          <ThemeToggleButton />
        </View>

        <DiningSummarySection
          caloriesGoal={state.goals.calories}
          carbsGoal={state.goals.carbs}
          fatsGoal={state.goals.fats}
          isCollapsed={isSummaryCollapsed}
          nutritionSummary={nutritionSummary}
          onCustomMealOpen={handleCustomMealOpen}
          onMealLogEdit={handleMealLogEdit}
          onToggleCollapsed={handleSummaryToggle}
          proteinGoal={state.goals.protein}
          todaysMeals={todaysMeals}
        />

        <View style={styles.stack}>
          <View style={styles.periodGrid}>
            {PERIODS.map((period) => (
              <PeriodChip
                key={period.key}
                label={period.label}
                selected={period.key === selectedPeriod}
                onPress={() => {
                  setSelectedPeriod(period.key);
                  setPreferredDiningPeriod(period.key as MealPeriod);
                }}
              />
            ))}
          </View>
          <View style={styles.list}>
            {hallsForPeriod.map((hall) => (
              <HallRow
                key={hall.id}
                hall={hall}
                onPress={() => handleHallOpen(hall)}
                selectedPeriod={selectedPeriod}
              />
            ))}
          </View>
        </View>
      </AppScreen>

      <DiningHallModal
        activeItem={effectiveSelectedMenuItem}
        activePeriod={activeHallPeriod}
        hall={activeHall}
        isLoading={diningMenuState.isLoading && activeHallItems.length === 0}
        menuError={diningMenuState.error}
        menuSections={activeHallSections}
        onClose={() => {
          setActiveHallId(null);
          setSelectedMenuItem(null);
          setSelectedServings(1);
          setHallSearchQuery('');
        }}
        onOpenItem={(item) => {
          setSelectedMenuItem(item);
          setSelectedServings(1);
        }}
        onCloseItem={() => {
          setSelectedMenuItem(null);
          setSelectedServings(1);
        }}
        onSaveItem={handleDiningItemSave}
        onSearchChange={setHallSearchQuery}
        onServingsChange={setSelectedServings}
        searchQuery={hallSearchQuery}
        selectedItemTotals={selectedItemTotals}
        servings={selectedServings}
      />

      <CustomMealComposer
        draft={customMealDraft}
        editingMeal={editingMealLog}
        isOpen={customMealOpen}
        onChange={setCustomMealDraft}
        onDelete={handleMealLogDelete}
        onClose={() => {
          setCustomMealOpen(false);
          setEditingMealLog(null);
        }}
        onSave={handleCustomMealSave}
      />
    </>
  );
}

function DiningSummarySection({
  caloriesGoal,
  carbsGoal,
  fatsGoal,
  isCollapsed,
  nutritionSummary,
  onCustomMealOpen,
  onMealLogEdit,
  onToggleCollapsed,
  proteinGoal,
  todaysMeals,
}: {
  caloriesGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  isCollapsed: boolean;
  nutritionSummary: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  onCustomMealOpen: () => void;
  onMealLogEdit: (meal: MealLog) => void;
  onToggleCollapsed: () => void;
  proteinGoal: number;
  todaysMeals: MealLog[];
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  const summaryLine = `${todaysMeals.length} meals today • P ${nutritionSummary.protein} • C ${nutritionSummary.carbs} • F ${nutritionSummary.fats}`;
  const [isMealsExpanded, setIsMealsExpanded] = useState(false);

  useEffect(() => {
    if (isCollapsed) {
      setIsMealsExpanded(false);
    }
  }, [isCollapsed]);

  if (isCollapsed) {
    return (
      <PressScale haptic="light" onPress={onToggleCollapsed}>
        <SurfaceCard floating style={styles.summaryShelfCard}>
          <View style={styles.summaryShelfContent}>
            <View style={styles.summaryShelfLeading}>
              <MiniSummaryRing progress={nutritionSummary.calories / caloriesGoal} />
              <View style={styles.summaryShelfCopy}>
                <AppText numberOfLines={1} variant="bodyStrong">
                  {nutritionSummary.calories.toLocaleString()}/{caloriesGoal.toLocaleString()} cal
                </AppText>
                <AppText numberOfLines={1} variant="micro" dimmed>
                  {summaryLine}
                </AppText>
              </View>
            </View>
            <Ionicons name="chevron-down" size={18} color={AppColors.textSubtle} />
          </View>
        </SurfaceCard>
      </PressScale>
    );
  }

  return (
    <SurfaceCard floating style={styles.summaryModuleCard}>
      <View style={styles.summaryModuleHeader}>
        <View />
        <PressScale haptic="light" onPress={onToggleCollapsed}>
          <View style={styles.summaryChevronButton}>
            <Ionicons name="chevron-up" size={18} color={AppColors.textSubtle} />
          </View>
        </PressScale>
      </View>

      <View style={styles.breakdownTop}>
        <View style={styles.breakdownCopy}>
          <AppText variant="micro" dimmed>
            Calories
          </AppText>
          <AppText variant="headline">
            {nutritionSummary.calories.toLocaleString()}/{caloriesGoal.toLocaleString()}
          </AppText>
        </View>
        <IconRing
          progress={nutritionSummary.calories / caloriesGoal}
          color={AppColors.text}
          icon="flame"
          size={74}
          strokeWidth={8}
        />
      </View>

      <View style={styles.breakdownRows}>
        <BreakdownRow
          label="Protein"
          value={`${nutritionSummary.protein}/${proteinGoal}g`}
          progress={nutritionSummary.protein / proteinGoal}
          iconKey={MACRO_META.protein.key}
          color={MACRO_META.protein.color}
        />
        <BreakdownRow
          label="Carbs"
          value={`${nutritionSummary.carbs}/${carbsGoal}g`}
          progress={nutritionSummary.carbs / carbsGoal}
          iconKey={MACRO_META.carbs.key}
          color={MACRO_META.carbs.color}
        />
        <BreakdownRow
          label="Fats"
          value={`${nutritionSummary.fats}/${fatsGoal}g`}
          progress={nutritionSummary.fats / fatsGoal}
          iconKey={MACRO_META.fats.key}
          color={MACRO_META.fats.color}
        />
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryMealsSection}>
        <View style={styles.summaryMealsHeader}>
          <View style={styles.summaryMealsTitleWrap}>
            <AppText variant="title">Logged meals</AppText>
            {todaysMeals.length > 0 ? (
              <AppText variant="micro" dimmed>
                {todaysMeals.length} logged today
              </AppText>
            ) : null}
          </View>
          <View style={styles.summaryMealsHeaderActions}>
            <PressScale haptic="light" onPress={onCustomMealOpen}>
              <View style={styles.customMealButton}>
                <Ionicons name="add" size={18} color={AppColors.primary} />
              </View>
            </PressScale>
            <PressScale
              haptic="light"
              onPress={() => setIsMealsExpanded((currentValue) => !currentValue)}>
              <View style={styles.summaryChevronButton}>
                <Ionicons
                  name={isMealsExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={AppColors.textSubtle}
                />
              </View>
            </PressScale>
          </View>
        </View>

        {todaysMeals.length > 0 ? (
          isMealsExpanded ? (
            <ScrollView
              nestedScrollEnabled
              style={styles.summaryMealsScroller}
              contentContainerStyle={styles.summaryMealsList}
              showsVerticalScrollIndicator={false}>
              {todaysMeals.map((meal, index) => (
                <PressScale
                  key={meal.id}
                  haptic="light"
                  onPress={() => onMealLogEdit(meal)}>
                  <View
                    style={[
                      styles.loggedMealRow,
                      index < todaysMeals.length - 1 ? styles.rowSpacing : null,
                    ]}>
                    <View style={styles.loggedMealCopy}>
                      <AppText variant="bodyStrong">{meal.title}</AppText>
                      <AppText variant="micro" dimmed>
                        {formatMealLogMeta(meal)}
                      </AppText>
                    </View>
                    <View style={styles.loggedMealActions}>
                      <AppText variant="title" color={AppColors.primary}>
                        {meal.calories}
                      </AppText>
                      <View style={styles.loggedMealActionButton}>
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={AppColors.textSubtle}
                        />
                      </View>
                    </View>
                  </View>
                </PressScale>
              ))}
            </ScrollView>
          ) : null
        ) : (
          <View style={styles.summaryMealsEmpty}>
            <AppText variant="bodyStrong">Nothing logged yet</AppText>
            <AppText dimmed>
              Use the plus button for a custom entry or open a hall to log from the live UCLA menu.
            </AppText>
          </View>
        )}
      </View>
    </SurfaceCard>
  );
}

function MiniSummaryRing({
  progress,
}: {
  progress: number;
}) {
  const { colors: AppColors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  const ringSize = 34;
  const strokeWidth = 4;
  const ringColor = isDark ? AppColors.background : AppColors.text;
  const ringTrackColor = isDark ? 'rgba(15, 17, 23, 0.14)' : '#ECECF4';

  return (
    <View
      style={[
        styles.summaryShelfRingWrap,
        isDark
          ? {
              borderRadius: ringSize / 2,
              backgroundColor: AppColors.white,
            }
          : null,
      ]}>
      <ProgressRing
        progress={progress}
        value=""
        unit=""
        caption=""
        size={ringSize}
        strokeWidth={strokeWidth}
        color={ringColor}
        trackColor={ringTrackColor}
        hideLabel
      />
      <View style={styles.summaryShelfRingCenter}>
        <Ionicons name="flame" size={11} color={ringColor} />
      </View>
    </View>
  );
}

function DiningHallModal({
  activeItem,
  activePeriod,
  hall,
  isLoading,
  menuError,
  menuSections,
  onClose,
  onOpenItem,
  onCloseItem,
  onSaveItem,
  onSearchChange,
  onServingsChange,
  searchQuery,
  selectedItemTotals,
  servings,
}: {
  activeItem: DiningMenuItem | null;
  activePeriod: PeriodKey;
  hall: PublicDiningHall | null;
  isLoading: boolean;
  menuError: string | null;
  menuSections: DiningMenuSection[];
  onClose: () => void;
  onOpenItem: (item: DiningMenuItem) => void;
  onCloseItem: () => void;
  onSaveItem: (overrides?: DiningMealSaveOverrides) => void;
  onSearchChange: (value: string) => void;
  onServingsChange: (value: number) => void;
  searchQuery: string;
  selectedItemTotals: ReturnType<typeof getMenuItemTotals> | null;
  servings: number;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showNutritionFacts, setShowNutritionFacts] = useState(false);
  const [customizationQuantities, setCustomizationQuantities] = useState<Record<string, number>>(
    {},
  );
  const activePeriodLabel = getPeriodLabel(activePeriod);
  const nutritionFacts = activeItem ? getDetailNutritionFacts(activeItem) : [];
  const isCustomizableItem = Boolean(activeItem?.customizationOptions.length);
  const customizationTotals = useMemo(() => {
    if (!activeItem?.customizationOptions.length) {
      return null;
    }

    return activeItem.customizationOptions.reduce(
      (totals, option) => {
        const quantity = customizationQuantities[getCustomizationOptionKey(option)] ?? 0;

        return {
          calories: totals.calories + Math.round((option.calories ?? 0) * quantity),
          protein: totals.protein + Math.round((option.proteinG ?? 0) * quantity),
          carbs: totals.carbs + Math.round((option.carbsG ?? 0) * quantity),
          fats: totals.fats + Math.round((option.fatsG ?? 0) * quantity),
        };
      },
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      },
    );
  }, [activeItem, customizationQuantities]);
  const selectedCustomizationCount = useMemo(
    () => Object.values(customizationQuantities).filter((quantity) => quantity > 0).length,
    [customizationQuantities],
  );

  useEffect(() => {
    setShowIngredients(false);
    setShowNutritionFacts(false);
    setCustomizationQuantities({});
  }, [activeItem?.itemName, activeItem?.recipeId]);

  const handleCustomizationToggle = (option: DiningCustomizationOption) => {
    const optionKey = getCustomizationOptionKey(option);
    const currentQuantity = customizationQuantities[optionKey] ?? 0;

    setCustomizationQuantities((currentValue) => {
      const nextValue = { ...currentValue };

      if (currentQuantity > 0) {
        delete nextValue[optionKey];
        return nextValue;
      }

      nextValue[optionKey] = Math.max(1, option.defaultQuantity);
      return nextValue;
    });
  };

  const handleCustomizationQuantityChange = (
    option: DiningCustomizationOption,
    nextQuantity: number,
  ) => {
    const optionKey = getCustomizationOptionKey(option);

    setCustomizationQuantities((currentValue) => {
      const nextValue = { ...currentValue };

      if (nextQuantity <= 0) {
        delete nextValue[optionKey];
        return nextValue;
      }

      nextValue[optionKey] = nextQuantity;
      return nextValue;
    });
  };

  const handleCustomizationSave = () => {
    if (!activeItem || !customizationTotals || selectedCustomizationCount === 0) {
      return;
    }

    onSaveItem({
      nutritionOverride: {
        calories: customizationTotals.calories,
        proteinG: customizationTotals.protein,
        carbsG: customizationTotals.carbs,
        fatsG: customizationTotals.fats,
      },
      servings: 1,
      titleOverride: activeItem.itemName,
    });
  };

  return (
    <Modal
      allowSwipeDismissal={Platform.OS === 'ios'}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      transparent={false}
      visible={Boolean(hall)}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.menuModalRoot}>
        <View style={styles.menuModalCard}>
          <View style={styles.menuModalHeader}>
            <View style={styles.menuHeaderTop}>
              <View style={styles.menuHeaderCopy}>
                <AppText variant="headline">{hall?.name ?? 'Dining hall'}</AppText>
              </View>
              <PressScale haptic="none" onPress={onClose}>
                <View style={styles.menuHeaderButton}>
                  <Ionicons name="close" size={22} color={AppColors.text} />
                </View>
              </PressScale>
            </View>

            <View style={styles.menuSearchShellCompact}>
              <Ionicons name="search" size={18} color={AppColors.textSubtle} />
              <TextInput
                placeholder={`Filter ${activePeriodLabel.toLowerCase()} items`}
                placeholderTextColor={AppColors.textSubtle}
                style={styles.menuSearchInput}
                value={searchQuery}
                onChangeText={onSearchChange}
              />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.menuModalScrollContent}
            showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <SurfaceCard style={styles.menuEmptyState}>
                <AppText variant="bodyStrong">Loading menu</AppText>
                <AppText dimmed>
                  Loading today&apos;s UCLA menu.
                </AppText>
              </SurfaceCard>
            ) : menuSections.length > 0 ? (
              menuSections.map((section) => (
                <View key={section.stationName} style={styles.menuSection}>
                  <AppText style={styles.menuSectionLabel} variant="label" dimmed>
                    {section.stationName}
                  </AppText>
                  <View style={styles.menuItemsList}>
                    {section.items.map((item) => (
                      <SurfaceCard
                        key={`${item.stationName}-${item.itemOrder}-${item.itemName}`}
                        style={styles.menuItemCard}>
                        <View style={styles.menuItemTopRowCompact}>
                          <View style={styles.menuItemCopyCompact}>
                            <AppText numberOfLines={2} variant="bodyStrong">
                              {item.itemName}
                            </AppText>
                            <AppText
                              numberOfLines={1}
                              style={styles.menuItemNutritionLabelCompact}
                              variant="micro"
                              dimmed>
                              {formatInlineMacros(item)}
                            </AppText>
                          </View>
                          {item.badgeLabels.length > 0 ? (
                            <View style={styles.menuBadgeRowCompact}>
                              {item.badgeLabels.slice(0, 4).map((badge) => (
                                <MenuBadge key={`${item.itemName}-${badge}`} label={badge} />
                              ))}
                            </View>
                          ) : null}
                          <PressScale
                            haptic="light"
                            onPress={() => onOpenItem(item)}>
                            <View style={styles.menuAddButtonCompact}>
                              <Ionicons name="add" size={16} color={AppColors.primary} />
                            </View>
                          </PressScale>
                        </View>
                      </SurfaceCard>
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <SurfaceCard style={styles.menuEmptyState}>
                <AppText variant="bodyStrong">No menu items here yet</AppText>
                <AppText dimmed>
                  {menuError
                    ? 'The app has no fresh menu snapshot to show for this hall and period yet.'
                    : 'Try another meal period or wait for the next ingestion run.'}
                </AppText>
              </SurfaceCard>
            )}
          </ScrollView>

          {activeItem && selectedItemTotals ? (
            <View style={styles.itemSheetOverlay}>
              <PressScale
                containerStyle={styles.itemSheetScrim}
                haptic="none"
                onPress={onCloseItem}>
                <View />
              </PressScale>
              {isCustomizableItem && customizationTotals ? (
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={styles.itemSheetCard}>
                  <ScrollView
                    bounces={false}
                    contentContainerStyle={styles.buildYourOwnContent}
                    showsVerticalScrollIndicator={false}>
                    <View style={styles.sheetGrabber} />
                    <View style={styles.itemSheetHeader}>
                      <View style={styles.itemSheetCopy}>
                        <AppText variant="headline">{activeItem.itemName}</AppText>
                        <AppText dimmed>
                          {activeItem.hallName} • {activeItem.stationName}
                        </AppText>
                      </View>
                      <PressScale haptic="none" onPress={onCloseItem}>
                        <View style={styles.sheetCloseButton}>
                          <Ionicons name="close" size={20} color={AppColors.text} />
                        </View>
                      </PressScale>
                    </View>

                    <SurfaceCard style={styles.compactMetricCard}>
                      <View style={styles.compactMetricRow}>
                        <CompactMetric label="Calories" value={`${customizationTotals.calories} cal`} />
                        <CompactMetric label="Protein" value={`${customizationTotals.protein}g`} />
                        <CompactMetric label="Carbs" value={`${customizationTotals.carbs}g`} />
                        <CompactMetric label="Fat" value={`${customizationTotals.fats}g`} />
                      </View>
                    </SurfaceCard>

                    <View style={styles.buildYourOwnOptionsList}>
                      {activeItem.customizationOptions.map((option) => {
                        const optionKey = getCustomizationOptionKey(option);
                        const selectedQuantity = customizationQuantities[optionKey] ?? 0;
                        const isSelected = selectedQuantity > 0;

                        return (
                          <View key={optionKey} style={styles.buildYourOwnOptionCard}>
                            <PressScale
                              haptic="light"
                              pressEffect="none"
                              onPress={() => handleCustomizationToggle(option)}>
                              <View style={styles.buildYourOwnOptionTopRow}>
                                <View style={styles.buildYourOwnOptionCopy}>
                                  <AppText variant="bodyStrong">{option.itemName}</AppText>
                                  <AppText variant="micro" dimmed>{formatCustomizationOptionMeta(option)}</AppText>
                                </View>
                                {isSelected ? (
                                  <View style={styles.buildYourOwnOptionStepper}>
                                    <StepperButton
                                      icon="remove"
                                      onPress={() =>
                                        handleCustomizationQuantityChange(
                                          option,
                                          selectedQuantity - 1,
                                        )
                                      }
                                    />
                                    <AppText variant="title">{selectedQuantity}</AppText>
                                    <StepperButton
                                      icon="add"
                                      onPress={() =>
                                        handleCustomizationQuantityChange(
                                          option,
                                          selectedQuantity + 1,
                                        )
                                      }
                                    />
                                  </View>
                                ) : (
                                  <View style={styles.buildYourOwnCheckbox}>
                                    <Ionicons
                                      name="add"
                                      size={18}
                                      color={AppColors.primary}
                                    />
                                  </View>
                                )}
                              </View>
                            </PressScale>

                            {option.badgeLabels.length > 0 ? (
                              <View style={styles.buildYourOwnOptionBadges}>
                                {option.badgeLabels.slice(0, 4).map((badge) => (
                                  <MenuBadge
                                    key={`${option.itemName}-${badge}`}
                                    label={badge}
                                  />
                                ))}
                              </View>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>

                  <View style={styles.itemSheetFooter}>
                    <View
                      style={[
                        styles.buildYourOwnAddButton,
                        selectedCustomizationCount === 0
                          ? styles.buildYourOwnAddButtonDisabled
                          : null,
                      ]}>
                      <PressScale
                        haptic="medium"
                        onPress={selectedCustomizationCount > 0 ? handleCustomizationSave : undefined}>
                        <View style={styles.buildYourOwnAddButtonInner}>
                          <Ionicons
                            name="add"
                            size={18}
                            color={
                              selectedCustomizationCount > 0
                                ? AppColors.white
                                : AppColors.textSubtle
                            }
                          />
                          <AppText
                            variant="bodyStrong"
                            color={
                              selectedCustomizationCount > 0
                                ? AppColors.white
                                : AppColors.textSubtle
                            }>
                            Add to Meal
                          </AppText>
                        </View>
                      </PressScale>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              ) : (
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={styles.itemSheetCard}>
                  <ScrollView
                    bounces={false}
                    style={styles.itemSheetScroll}
                    contentContainerStyle={styles.itemSheetContent}
                    showsVerticalScrollIndicator={false}>
                    <View style={styles.sheetGrabber} />
                    <View style={styles.itemSheetHeader}>
                      <View style={styles.itemSheetCopy}>
                        <AppText variant="headline">{activeItem.itemName}</AppText>
                        <AppText dimmed>
                          {activeItem.hallName} • {activeItem.stationName}
                        </AppText>
                      </View>
                      <PressScale haptic="none" onPress={onCloseItem}>
                        <View style={styles.sheetCloseButton}>
                          <Ionicons name="close" size={20} color={AppColors.text} />
                        </View>
                      </PressScale>
                    </View>

                    <View style={styles.itemSheetMetaWrap}>
                      <AppText variant="micro" dimmed style={styles.itemSheetServingText}>
                        {activeItem.servingSize
                          ? `Serving • ${activeItem.servingSize}`
                          : 'Serving details unavailable'}
                      </AppText>
                      {activeItem.badgeLabels.length > 0 ? (
                        <View style={styles.itemSheetBadgeRow}>
                          {activeItem.badgeLabels.map((badge) => (
                            <MenuBadge key={`${activeItem.itemName}-${badge}-detail`} label={badge} />
                          ))}
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.servingsRowCompact}>
                      <AppText variant="title">Servings</AppText>
                      <View style={styles.stepper}>
                        <StepperButton
                          icon="remove"
                          onPress={() => onServingsChange(normalizeServingStep(servings - 0.5))}
                        />
                        <AppText variant="headline">{formatServingCount(servings)}</AppText>
                        <StepperButton
                          icon="add"
                          onPress={() => onServingsChange(normalizeServingStep(servings + 0.5))}
                        />
                      </View>
                    </View>

                    <SurfaceCard style={styles.compactMetricCard}>
                      <View style={styles.compactMetricRow}>
                        <CompactMetric
                          label="Calories"
                          value={formatMenuItemTotalValue(selectedItemTotals.calories, 'cal', {
                            calories: true,
                          })}
                        />
                        <CompactMetric
                          label="Protein"
                          value={formatMenuItemTotalValue(selectedItemTotals.protein, 'g')}
                        />
                        <CompactMetric
                          label="Carbs"
                          value={formatMenuItemTotalValue(selectedItemTotals.carbs, 'g')}
                        />
                        <CompactMetric
                          label="Fat"
                          value={formatMenuItemTotalValue(selectedItemTotals.fats, 'g')}
                        />
                      </View>
                    </SurfaceCard>

                    {nutritionFacts.length > 0 ? (
                      <CollapsibleDetailSection
                        isOpen={showNutritionFacts}
                        onPress={() => setShowNutritionFacts((currentValue) => !currentValue)}
                        title="Nutrition facts">
                        <NutritionFactsPanel facts={nutritionFacts} />
                      </CollapsibleDetailSection>
                    ) : null}

                    {activeItem.ingredients.length > 0 || activeItem.allergenLabels.length > 0 ? (
                      <CollapsibleDetailSection
                        contentStyle={styles.ingredientSectionContent}
                        isOpen={showIngredients}
                        onPress={() => setShowIngredients((currentValue) => !currentValue)}
                        title="Ingredients">
                        {activeItem.allergenLabels.length > 0 ? (
                          <View style={styles.detailTagWrap}>
                            {activeItem.allergenLabels.map((label) => (
                              <DetailTag key={`${activeItem.itemName}-${label}`} label={label} tone="warning" />
                            ))}
                          </View>
                        ) : null}
                        <View style={styles.ingredientList}>
                          {activeItem.ingredients.map((ingredient) => (
                            <View
                              key={`${activeItem.itemName}-${ingredient}`}
                              style={styles.ingredientRow}>
                              <View style={styles.ingredientBullet} />
                              <AppText style={styles.ingredientText}>{ingredient}</AppText>
                            </View>
                          ))}
                        </View>
                      </CollapsibleDetailSection>
                    ) : null}
                  </ScrollView>
                  <View style={styles.itemSheetFooter}>
                    <ActionButton
                      label={`Add ${formatServingCount(servings)} serving${servings === 1 ? '' : 's'}`}
                      onPress={() => onSaveItem()}
                    />
                  </View>
                </KeyboardAvoidingView>
              )}
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function CustomMealComposer({
  draft,
  editingMeal,
  isOpen,
  onChange,
  onDelete,
  onClose,
  onSave,
}: {
  draft: CustomMealDraft;
  editingMeal: MealLog | null;
  isOpen: boolean;
  onChange: (draft: CustomMealDraft) => void;
  onDelete: () => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.sheetModalRoot}>
        <View style={styles.sheetModalBackdrop} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetModalContainer}>
          <SurfaceCard style={styles.sheetModalCard}>
            <View style={styles.sheetGrabber} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <AppText variant="headline">
                  {editingMeal ? 'Edit meal' : 'Custom meal'}
                </AppText>
                {editingMeal ? (
                  <AppText dimmed>Adjust this meal log or remove it from today.</AppText>
                ) : null}
              </View>
              <PressScale haptic="none" onPress={onClose}>
                <View style={styles.sheetCloseButton}>
                  <Ionicons name="close" size={20} color={AppColors.text} />
                </View>
              </PressScale>
            </View>

            <View style={styles.sheetField}>
              <AppText variant="micro" dimmed>
                Meal period
              </AppText>
              <View style={styles.customPeriodWrap}>
                {CUSTOM_MEAL_PERIODS.map((period) => (
                  <CustomPeriodChip
                    key={period.key}
                    label={period.label}
                    selected={draft.period === period.key}
                    onPress={() => onChange({ ...draft, period: period.key })}
                  />
                ))}
              </View>
            </View>

            <InputField
              label="Meal name"
              onChangeText={(value) => onChange({ ...draft, title: value })}
              placeholder=""
              value={draft.title}
            />

            <View style={styles.customMacroGrid}>
              <View style={styles.customMacroCell}>
                <AppText variant="micro" dimmed>Calories</AppText>
                <TextInput
                  keyboardType="numbers-and-punctuation"
                  onChangeText={(v) => onChange({ ...draft, calories: v })}
                  style={styles.customMacroInput}
                  value={draft.calories}
                />
              </View>
              <View style={styles.customMacroCell}>
                <AppText variant="micro" dimmed>Protein</AppText>
                <TextInput
                  keyboardType="numbers-and-punctuation"
                  onChangeText={(v) => onChange({ ...draft, protein: v })}
                  style={styles.customMacroInput}
                  value={draft.protein}
                />
              </View>
              <View style={styles.customMacroCell}>
                <AppText variant="micro" dimmed>Carbs</AppText>
                <TextInput
                  keyboardType="numbers-and-punctuation"
                  onChangeText={(v) => onChange({ ...draft, carbs: v })}
                  style={styles.customMacroInput}
                  value={draft.carbs}
                />
              </View>
              <View style={styles.customMacroCell}>
                <AppText variant="micro" dimmed>Fat</AppText>
                <TextInput
                  keyboardType="numbers-and-punctuation"
                  onChangeText={(v) => onChange({ ...draft, fats: v })}
                  style={styles.customMacroInput}
                  value={draft.fats}
                />
              </View>
            </View>

            {editingMeal ? (
              <View style={styles.mealEditorActions}>
                <PressScale haptic="none" onPress={onDelete}>
                  <View style={styles.deleteMealButton}>
                    <Ionicons name="trash-outline" size={18} color={AppColors.danger} />
                    <AppText variant="label" color={AppColors.danger}>
                      Delete
                    </AppText>
                  </View>
                </PressScale>
                <View style={styles.mealEditorSaveButton}>
                  <ActionButton label="Save changes" onPress={onSave} />
                </View>
              </View>
            ) : (
              <ActionButton label="Save custom meal" onPress={onSave} />
            )}
          </SurfaceCard>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function InputField({
  keyboardType = 'default',
  label,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?: 'default' | 'numbers-and-punctuation';
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  return (
    <View style={styles.sheetField}>
      <AppText variant="micro" dimmed>
        {label}
      </AppText>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={AppColors.textSubtle}
        style={styles.sheetInput}
        value={value}
      />
    </View>
  );
}

function StepperButton({
  icon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  return (
    <PressScale haptic="light" onPress={onPress}>
      <View style={styles.stepperButton}>
        <Ionicons name={icon} size={18} color={AppColors.text} />
      </View>
    </PressScale>
  );
}

function CompactMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  return (
    <View style={styles.compactMetricCell}>
      <AppText variant="bodyStrong">{value}</AppText>
      <AppText variant="micro" dimmed>
        {label}
      </AppText>
    </View>
  );
}

function CollapsibleDetailSection({
  children,
  contentStyle,
  isOpen,
  onPress,
  title,
}: {
  children: ReactNode;
  contentStyle?: object;
  isOpen: boolean;
  onPress: () => void;
  title: string;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  return (
    <View style={styles.collapsibleSection}>
      <PressScale haptic="none" onPress={onPress}>
        <View style={styles.collapsibleSectionHeader}>
          <AppText variant="bodyStrong">{title}</AppText>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={AppColors.textSubtle}
          />
        </View>
      </PressScale>
      {isOpen ? <View style={contentStyle}>{children}</View> : null}
    </View>
  );
}

function NutritionFactChip({
  fact,
  isLast = false,
}: {
  fact: DiningNutritionFact;
  isLast?: boolean;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  return (
    <View style={[styles.nutritionFactChip, isLast ? styles.nutritionFactRowLast : null]}>
      <View style={styles.nutritionFactColumns}>
        <AppText variant="body" dimmed style={styles.nutritionFactNameColumn}>
          {fact.label}
        </AppText>
        <AppText variant="bodyStrong" style={styles.nutritionFactValueColumn}>
          {fact.value}
        </AppText>
        <AppText variant="micro" dimmed style={styles.nutritionFactDailyValueColumn}>
          {fact.dailyValuePercent !== null ? `${fact.dailyValuePercent}% DV` : ' '}
        </AppText>
      </View>
    </View>
  );
}

function NutritionFactsPanel({
  facts,
}: {
  facts: DiningNutritionFact[];
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  return (
    <View style={styles.nutritionFactsPanel}>
      {facts.map((fact, index) => (
        <NutritionFactChip
          key={fact.id}
          fact={fact}
          isLast={index === facts.length - 1}
        />
      ))}
    </View>
  );
}

function MenuBadge({ label }: { label: string }) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  const presentation = getBadgePresentation(label);

  return (
    <View style={styles.menuBadge}>
      {presentation.imageUri ? (
        <Image source={{ uri: presentation.imageUri }} style={styles.menuBadgeImage} contentFit="contain" />
      ) : presentation.iconFamily === 'ion' && presentation.iconName ? (
        <Ionicons
          name={presentation.iconName as keyof typeof Ionicons.glyphMap}
          size={12}
          color={presentation.foregroundColor}
        />
      ) : presentation.iconFamily === 'material' && presentation.iconName ? (
        <MaterialCommunityIcons
          name={presentation.iconName as never}
          size={12}
          color={presentation.foregroundColor}
        />
      ) : (
        <AppText variant="micro" color={presentation.foregroundColor} style={styles.menuBadgeText}>
          {presentation.text}
        </AppText>
      )}
    </View>
  );
}

function DetailTag({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'primary' | 'warning';
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  return (
    <View
      style={[
        styles.detailTag,
        tone === 'primary'
          ? styles.detailTagPrimary
          : tone === 'warning'
            ? styles.detailTagWarning
            : null,
      ]}>
      <AppText
        variant="label"
        color={
          tone === 'primary'
            ? AppColors.primary
            : tone === 'warning'
              ? '#8A6500'
              : AppColors.textMuted
        }>
        {label}
      </AppText>
    </View>
  );
}

function PeriodChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  return (
    <PressScale onPress={onPress} containerStyle={styles.periodChipPress}>
      <View
        style={[
          styles.periodChip,
          selected ? styles.periodChipSelected : styles.periodChipDefault,
        ]}>
        <AppText
          variant="label"
          color={selected ? AppColors.white : AppColors.textMuted}>
          {label}
        </AppText>
      </View>
    </PressScale>
  );
}

function CustomPeriodChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  return (
    <PressScale containerStyle={{ flex: 1 }} onPress={onPress}>
      <View
        style={[
          styles.customPeriodChip,
          selected ? styles.customPeriodChipSelected : null,
        ]}>
        <AppText
          variant="label"
          color={selected ? AppColors.white : AppColors.textMuted}>
          {label}
        </AppText>
      </View>
    </PressScale>
  );
}

function IconRing({
  progress,
  color,
  icon,
  size,
  strokeWidth = 10,
}: {
  progress: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  size: number;
  strokeWidth?: number;
}) {
  const { colors: AppColors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  const ringColor = isDark ? AppColors.background : color;
  const ringTrackColor = isDark ? 'rgba(15, 17, 23, 0.14)' : '#ECECF4';

  return (
    <View
      style={[
        styles.iconRingWrap,
        { width: size, height: size },
        isDark
          ? {
              borderRadius: size / 2,
              backgroundColor: AppColors.white,
            }
          : null,
      ]}>
      <ProgressRing
        progress={progress}
        value=""
        unit=""
        caption=""
        size={size}
        strokeWidth={strokeWidth}
        color={ringColor}
        trackColor={ringTrackColor}
        hideLabel
      />
      <View
        style={[
          styles.iconRingCenter,
          isDark
            ? {
                backgroundColor: AppColors.white,
              }
            : null,
        ]}>
        <Ionicons name={icon} size={14} color={ringColor} />
      </View>
    </View>
  );
}

function BreakdownRow({
  label,
  value,
  progress,
  iconKey,
  color,
}: {
  label: string;
  value: string;
  progress: number;
  iconKey: keyof typeof MACRO_META;
  color: string;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownMain}>
        <View style={styles.breakdownTopRow}>
          <View style={styles.breakdownLeft}>
            <MacroIcon iconKey={iconKey} color={color} />
            <AppText variant="body" dimmed>
              {label}
            </AppText>
          </View>
          <AppText variant="body">{value}</AppText>
        </View>
        <View style={styles.breakdownBarTrack}>
          <View
            style={[
              styles.breakdownBarFill,
              {
                width: `${Math.max(0, Math.min(progress, 1)) * 100}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function MacroIcon({
  iconKey,
  color,
}: {
  iconKey: keyof typeof MACRO_META;
  color: string;
}) {
  if (iconKey === 'protein') {
    return <MaterialCommunityIcons name="food-drumstick" size={14} color={color} />;
  }

  if (iconKey === 'carbs') {
    return <MaterialCommunityIcons name="bread-slice" size={14} color={color} />;
  }

  return <MaterialCommunityIcons name="peanut" size={14} color={color} />;
}

function HallRow({
  hall,
  onPress,
  selectedPeriod,
}: {
  hall: PublicDiningHall;
  onPress: () => void;
  selectedPeriod: PeriodKey;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  const hours = hall.hours[selectedPeriod];
  const showActivity = hall.fitPercent !== null && isDiningHallOpenForHours(hours);

  return (
    <PressScale haptic="light" onPress={onPress}>
      <SurfaceCard style={styles.hallCard}>
        <Image
          source={getDiningHallImageSource(hall.id)}
          style={styles.hallImage}
          contentFit="contain"
          transition={150}
        />
        <View style={styles.hallCopy}>
          <AppText variant="title">{hall.name}</AppText>
          <AppText dimmed>{hours}</AppText>
        </View>
        <View style={styles.hallMeta}>
          <View style={styles.hallMetaValue}>
            {showActivity ? (
              <View style={styles.hallMetaCopy}>
                <AppText variant="headline" color={AppColors.primary}>
                  {hall.fitPercent}%
                </AppText>
                <AppText variant="micro" dimmed>
                  activity
                </AppText>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={16} color={AppColors.textSubtle} />
          </View>
        </View>
      </SurfaceCard>
    </PressScale>
  );
}

function createCustomMealDraft(period: MealLogPeriod, mealLog?: MealLog): CustomMealDraft {
  return {
    id: mealLog?.id,
    title: mealLog?.title ?? '',
    calories: mealLog ? String(mealLog.calories) : '',
    protein: mealLog ? String(mealLog.protein) : '',
    carbs: mealLog ? String(mealLog.carbs) : '',
    fats: mealLog ? String(mealLog.fats) : '',
    period: mealLog?.period ?? period,
  };
}

function getLaunchDiningPeriod(): PeriodKey {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;

  if (hour >= 6 && hour < 10.5) {
    return 'breakfast';
  }

  if (hour >= 10.5 && hour < 15.5) {
    return 'lunch';
  }

  if (hour >= 15.5 && hour < 21) {
    return 'dinner';
  }

  return 'lateNight';
}

function parseTimeLabelToMinutes(timeLabel: string) {
  const normalized = timeLabel
    .trim()
    .toUpperCase()
    .replace(/\./g, '');
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);

  if (!match) {
    return null;
  }

  const hourValue = Number.parseInt(match[1], 10);
  const minuteValue = Number.parseInt(match[2] ?? '0', 10);

  if (
    Number.isNaN(hourValue) ||
    Number.isNaN(minuteValue) ||
    hourValue < 1 ||
    hourValue > 12 ||
    minuteValue < 0 ||
    minuteValue > 59
  ) {
    return null;
  }

  const normalizedHour = hourValue % 12;
  const dayOffset = match[3] === 'PM' ? 12 * 60 : 0;

  return normalizedHour * 60 + minuteValue + dayOffset;
}

function isDiningHallOpenForHours(hours: string | null) {
  if (!hours) {
    return false;
  }

  const rangeMatch = hours.match(/(.+?)\s*-\s*(.+)/);

  if (!rangeMatch) {
    return false;
  }

  const startMinutes = parseTimeLabelToMinutes(rangeMatch[1]);
  const endMinutes = parseTimeLabelToMinutes(rangeMatch[2]);

  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (endMinutes <= startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function parseMealNumber(value: string) {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : Number.NaN;
}

function formatServingCount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function normalizeServingStep(value: number) {
  return Math.max(0.5, Math.round(value * 2) / 2);
}

function getMenuItemTotals(item: DiningMenuItem, servings: number) {
  const normalizedServings = Math.max(0.5, servings);

  return {
    calories: Math.round((item.calories ?? 0) * normalizedServings),
    protein: item.proteinG === null ? null : Math.round(item.proteinG * normalizedServings),
    carbs: item.carbsG === null ? null : Math.round(item.carbsG * normalizedServings),
    fats: item.fatsG === null ? null : Math.round(item.fatsG * normalizedServings),
  };
}

function formatMenuItemTotalValue(
  value: number | null,
  unit: string,
  options?: { calories?: boolean },
) {
  if (value === null) {
    return options?.calories ? 'Unavailable' : '--';
  }

  return options?.calories ? `${value} ${unit}` : `${value}${unit}`;
}

function getCustomizationOptionKey(option: DiningCustomizationOption) {
  return option.recipeId !== null
    ? `recipe-${option.recipeId}`
    : `option-${option.itemName.toLowerCase().replace(/\s+/g, '-')}`;
}

function formatCustomizationOptionMeta(option: DiningCustomizationOption) {
  if (
    option.calories === null &&
    option.proteinG === null &&
    option.carbsG === null &&
    option.fatsG === null
  ) {
    return option.servingSize
      ? `Serving • ${option.servingSize}`
      : 'Nutrition unavailable';
  }

  const macroSummary = `${option.calories ?? 0} cal • P ${option.proteinG ?? 0}g • C ${option.carbsG ?? 0}g • F ${option.fatsG ?? 0}g`;
  return option.servingSize ? `${macroSummary} • ${option.servingSize}` : macroSummary;
}

function getPeriodLabel(period: PeriodKey) {
  return PERIODS.find((candidate) => candidate.key === period)?.label ?? 'Menu';
}

function matchesDiningMenuQuery(item: DiningMenuItem, query: string) {
  const searchableFields = [
    item.itemName,
    item.stationName,
    item.servingSize ?? '',
    ...item.badgeLabels,
    ...item.allergenLabels,
    ...item.ingredients,
  ];

  return searchableFields.some((value) => value.toLowerCase().includes(query));
}

function formatInlineMacros(item: DiningMenuItem) {
  if (
    item.calories === null &&
    item.proteinG === null &&
    item.carbsG === null &&
    item.fatsG === null
  ) {
    return 'Nutrition unavailable';
  }

  if (item.customizationOptions.length > 0) {
    return 'Build your own';
  }

  if (item.proteinG === null || item.carbsG === null || item.fatsG === null) {
    return `${item.calories ?? 0} cal • macros unavailable`;
  }

  return `${item.calories ?? 0} cal • P ${item.proteinG}g • C ${item.carbsG}g • F ${item.fatsG}g`;
}

function getDetailNutritionFacts(item: DiningMenuItem) {
  const prioritizedFacts = [
    'saturatedFat',
    'cholesterol',
    'sodium',
    'dietaryFiber',
    'sugars',
    'includesAddedSugars',
    'calcium',
    'iron',
    'potassium',
    'vitaminA',
    'vitaminB6',
    'vitaminB12',
    'vitaminC',
    'vitaminD',
  ];
  const factOrder = new Map(prioritizedFacts.map((id, index) => [id, index]));

  return item.nutritionFacts
    .filter(
      (fact) =>
        !['calories', 'totalFat', 'totalCarbohydrate', 'protein'].includes(fact.id),
    )
    .sort((left, right) => {
      const leftRank = factOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER;
      const rightRank = factOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return left.label.localeCompare(right.label);
    });
}

function getBadgePresentation(label: string): BadgePresentation {
  const normalizedLabel = label.toLowerCase().replace(/_/g, ' ');

  if (normalizedLabel.includes('vegetarian')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.vegetarian, text: '' };
  }

  if (normalizedLabel.includes('vegan')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.vegan, text: '' };
  }

  if (normalizedLabel.includes('halal')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.halal, text: '' };
  }

  if (normalizedLabel.includes('low carbon') || normalizedLabel.includes('low-carbon')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.lowCarbon, text: '' };
  }

  if (normalizedLabel.includes('high carbon') || normalizedLabel.includes('high-carbon')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.highCarbon, text: '' };
  }

  if (normalizedLabel.includes('gluten')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.gluten, text: '' };
  }

  if (normalizedLabel.includes('wheat')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.wheat, text: '' };
  }

  if (normalizedLabel.includes('dairy') || normalizedLabel.includes('milk')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.dairy, text: '' };
  }

  if (normalizedLabel.includes('egg')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.egg, text: '' };
  }

  if (normalizedLabel.includes('fish')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.fish, text: '' };
  }

  if (normalizedLabel.includes('shellfish') || normalizedLabel.includes('crustacean')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.crustacean, text: '' };
  }

  if (normalizedLabel.includes('soy')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.soy, text: '' };
  }

  if (normalizedLabel.includes('tree-nut') || normalizedLabel.includes('tree nut')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.treeNuts, text: '' };
  }

  if (normalizedLabel.includes('peanut')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.peanut, text: '' };
  }

  if (normalizedLabel.includes('sesame')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.sesame, text: '' };
  }

  if (normalizedLabel.includes('alcohol')) {
    return { foregroundColor: AppColors.white, imageUri: OFFICIAL_BADGE_ICON_MAP.alcohol, text: '' };
  }

  return {
    foregroundColor: AppColors.text,
    text: label.slice(0, 1).toUpperCase(),
  };
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  content: {
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  header: {
    paddingTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  summaryModuleCard: {
    gap: Spacing.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  summaryModuleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  summaryChevronButton: {
    width: 34,
    height: 34,
    borderRadius: Radii.pill,
    backgroundColor: c.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: c.outlineVariant,
  },
  summaryMealsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  summaryMealsSection: {
    gap: Spacing.sm,
  },
  summaryMealsTitleWrap: {
    flex: 1,
    gap: 2,
  },
  summaryMealsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryMealsScroller: {
    maxHeight: 252,
  },
  summaryMealsList: {
    gap: Spacing.sm,
    paddingRight: Spacing.xs,
  },
  summaryMealsEmpty: {
    gap: Spacing.sm,
  },
  summaryShelfCard: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  summaryShelfContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  summaryShelfLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  summaryShelfCopy: {
    flex: 1,
    gap: 2,
  },
  summaryShelfRingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
  },
  summaryShelfRingCenter: {
    position: 'absolute',
    left: 11.5,
    width: 11,
    height: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRingWrap: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRingCenter: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: Radii.pill,
    backgroundColor: c.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customMealButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: c.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedMealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rowSpacing: {
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.outlineVariant,
  },
  loggedMealCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  loggedMealActions: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  loggedMealActionButton: {
    width: 32,
    height: 32,
    borderRadius: Radii.pill,
    backgroundColor: c.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownCard: {
    gap: Spacing.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  breakdownTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  breakdownCopy: {
    gap: Spacing.sm,
    flex: 1,
  },
  breakdownRows: {
    gap: Spacing.lg,
  },
  breakdownRow: {
    gap: Spacing.sm,
  },
  breakdownMain: {
    gap: Spacing.md,
  },
  breakdownTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  breakdownBarTrack: {
    height: 4,
    borderRadius: Radii.pill,
    overflow: 'hidden',
    backgroundColor: '#ECECF4',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
  pageDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#E3E5EA',
  },
  pageDotActive: {
    backgroundColor: c.text,
  },
  stack: {
    gap: Spacing.md,
  },
  periodGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  periodChipPress: {
    flex: 1,
  },
  periodChip: {
    width: '100%',
    minHeight: 50,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipSelected: {
    backgroundColor: c.primary,
  },
  periodChipDefault: {
    backgroundColor: c.surfaceLow,
  },
  list: {
    gap: Spacing.md,
  },
  hallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  hallImage: {
    width: 68,
    height: 44,
  },
  hallCopy: {
    flex: 1,
    gap: Spacing.xs,
    justifyContent: 'center',
    paddingTop: 4,
  },
  hallMeta: {
    alignItems: 'flex-end',
  },
  hallMetaValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  hallMetaCopy: {
    alignItems: 'flex-end',
  },
  menuModalRoot: {
    flex: 1,
    backgroundColor: c.background,
  },
  menuModalCard: {
    flex: 1,
  },
  menuModalHeader: {
    paddingHorizontal: Layout.pagePadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  menuHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  menuHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: Radii.pill,
    backgroundColor: c.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuHeaderCopy: {
    flex: 1,
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  menuSearchShellCompact: {
    minHeight: 44,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: c.outlineVariant,
    backgroundColor: c.surfaceLowest,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuSearchInput: {
    flex: 1,
    color: c.text,
    fontSize: 15,
    paddingVertical: 0,
  },
  menuModalScrollContent: {
    paddingHorizontal: Layout.pagePadding,
    paddingBottom: 220,
    gap: Spacing.xl,
  },
  menuSection: {
    gap: Spacing.xs,
  },
  menuSectionLabel: {
    paddingHorizontal: Spacing.xs,
    letterSpacing: 0.5,
  },
  menuItemsList: {
    gap: Spacing.xs,
  },
  menuItemCard: {
    backgroundColor: c.surfaceLowest,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItemTopRowCompact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  menuItemCopyCompact: {
    flex: 1,
    gap: 1,
  },
  menuItemNutritionLabelCompact: {
    letterSpacing: 0.2,
  },
  menuBadgeRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    marginTop: 2,
  },
  menuBadge: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBadgeImage: {
    width: 16,
    height: 16,
  },
  menuBadgeText: {
    letterSpacing: 0,
  },
  menuAddButtonCompact: {
    width: 28,
    height: 28,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surfaceLow,
    borderWidth: 1,
    borderColor: c.outlineVariant,
    marginTop: 1,
  },
  menuEmptyState: {
    backgroundColor: c.surfaceLowest,
    gap: Spacing.sm,
  },
  itemSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  itemSheetScrim: {
    flex: 1,
  },
  itemSheetCard: {
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    backgroundColor: c.surfaceLowest,
    maxHeight: '80%',
  },
  itemSheetScroll: {
    flexGrow: 0,
  },
  buildYourOwnContent: {
    paddingHorizontal: Layout.pagePadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  itemSheetContent: {
    paddingHorizontal: Layout.pagePadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  sheetGrabber: {
    width: 56,
    height: 5,
    borderRadius: Radii.pill,
    backgroundColor: c.surfaceHighest,
    alignSelf: 'center',
  },
  itemSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  itemSheetCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  itemSheetMetaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  itemSheetServingText: {
    flexShrink: 0,
  },
  itemSheetBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  sheetCloseButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: c.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: Radii.pill,
    backgroundColor: c.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactMetricCard: {
    backgroundColor: c.surfaceLow,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  compactMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  compactMetricCell: {
    flex: 1,
    gap: 2,
    alignItems: 'center',
  },
  sheetMacroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  buildYourOwnOptionsList: {
    gap: Spacing.sm,
  },
  buildYourOwnOptionCard: {
    backgroundColor: c.surfaceLow,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  buildYourOwnOptionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  buildYourOwnOptionCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  buildYourOwnOptionStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  buildYourOwnCheckbox: {
    width: 30,
    height: 30,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surfaceLow,
    borderWidth: 1,
    borderColor: c.outlineVariant,
  },
  buildYourOwnOptionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  buildYourOwnAddButton: {
    borderRadius: Radii.pill,
    backgroundColor: c.primary,
    overflow: 'hidden',
  },
  buildYourOwnAddButtonDisabled: {
    backgroundColor: c.surfaceHighest,
  },
  buildYourOwnAddButtonInner: {
    minHeight: 54,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  metricCard: {
    width: '47%',
    backgroundColor: c.surfaceLow,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  collapsibleSection: {
    gap: Spacing.sm,
  },
  collapsibleSectionHeader: {
    minHeight: 44,
    borderRadius: Radii.lg,
    backgroundColor: c.surfaceLow,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  detailSection: {
    gap: Spacing.sm,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  nutritionFactsPanel: {
    backgroundColor: c.surfaceLow,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  nutritionFactChip: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.outlineVariant,
  },
  nutritionFactColumns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  nutritionFactNameColumn: {
    flex: 1,
  },
  nutritionFactValueColumn: {
    minWidth: 72,
    textAlign: 'right',
  },
  nutritionFactDailyValueColumn: {
    minWidth: 58,
    textAlign: 'right',
  },
  nutritionFactRowLast: {
    borderBottomWidth: 0,
  },
  itemSheetFooter: {
    paddingHorizontal: Layout.pagePadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    backgroundColor: c.surfaceLowest,
    borderTopWidth: 1,
    borderTopColor: c.outlineVariant,
  },
  detailTagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  detailTag: {
    minHeight: 32,
    borderRadius: Radii.pill,
    backgroundColor: c.surfaceLow,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTagPrimary: {
    backgroundColor: c.secondaryContainer,
  },
  detailTagWarning: {
    backgroundColor: '#FFF0C6',
  },
  detailToggleButton: {
    minHeight: 32,
    borderRadius: Radii.pill,
    backgroundColor: c.surfaceLow,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientList: {
    gap: Spacing.sm,
  },
  ingredientSectionContent: {
    gap: Spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: Radii.pill,
    marginTop: 7,
    backgroundColor: c.primary,
  },
  ingredientText: {
    flex: 1,
  },
  sheetModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 13, 0.48)',
  },
  sheetModalContainer: {
    justifyContent: 'flex-end',
  },
  sheetModalCard: {
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: Layout.pagePadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  sheetHeaderCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  sheetField: {
    gap: Spacing.sm,
  },
  customPeriodWrap: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  customPeriodChip: {
    height: 36,
    alignSelf: 'stretch',
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.xs,
    backgroundColor: c.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customPeriodChipSelected: {
    backgroundColor: c.primary,
  },
  sheetInput: {
    minHeight: 48,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: c.outlineVariant,
    paddingHorizontal: Spacing.md,
    color: c.text,
    backgroundColor: c.surfaceLowest,
  },
  customMacroGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  customMacroCell: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  customMacroInput: {
    width: '100%',
    height: 52,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: c.outlineVariant,
    backgroundColor: c.surfaceLowest,
    color: c.text,
    textAlign: 'center',
    fontSize: 16,
  },
  mealEditorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  deleteMealButton: {
    minHeight: 48,
    borderRadius: Radii.lg,
    backgroundColor: '#FDEDEC',
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  mealEditorSaveButton: {
    flex: 1,
  },
  });
}
