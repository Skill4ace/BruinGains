import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const {
    addCustomMealLog,
    addDiningMealLog,
    clearTodayMealLogs,
    deleteMealLog,
    setPreferredDiningPeriod,
    state,
    updateMealLog,
  } = useAppData();
  const diningHallState = useDiningHalls();
  const diningMenuState = useDiningMenuItems();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>(
    state.userPreferences.preferredDiningPeriod,
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const [customMealOpen, setCustomMealOpen] = useState(false);
  const [customMealDraft, setCustomMealDraft] = useState<CustomMealDraft>(
    createCustomMealDraft(state.userPreferences.preferredDiningPeriod),
  );
  const [editingMealLog, setEditingMealLog] = useState<MealLog | null>(null);
  const [activeHallId, setActiveHallId] = useState<string | null>(null);
  const [activeHallPeriod, setActiveHallPeriod] = useState<PeriodKey>(selectedPeriod);
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
  const cardWidth = Math.min(width - Layout.pagePadding * 2, Layout.maxContentWidth);

  const hallsForPeriod = useMemo(() => {
    return diningHallState.data
      .filter((hall) => Boolean(hall.hours[selectedPeriod]))
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
  }, [diningHallState.data, selectedPeriod]);

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

      return diningMenuState.data.filter(
        (item) => item.hallId === activeHallId && (!latestForHall || item.serviceDate === latestForHall),
      );
    },
    [activeHallId, diningMenuState.data, latestServiceDateByHall],
  );

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

  const selectedItemTotals = useMemo(() => {
    if (!selectedMenuItem) {
      return null;
    }

    return getMenuItemTotals(selectedMenuItem, selectedServings);
  }, [selectedMenuItem, selectedServings]);

  const handleSlideEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    setActiveSlide(page);
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

  const handleClearAllMeals = () => {
    Alert.alert('Clear all meals?', `Remove all ${todaysMeals.length} logged meals from today?`, [
      {
        style: 'cancel',
        text: 'Cancel',
      },
      {
        style: 'destructive',
        text: 'Clear all',
        onPress: () => {
          clearTodayMealLogs();
          setEditingMealLog(null);
          setCustomMealOpen(false);
        },
      },
    ]);
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
      item: selectedMenuItem,
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
        </View>

        <View style={styles.carouselWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleSlideEnd}>
            <View style={[styles.page, { width: cardWidth }]}>
              <SurfaceCard floating style={styles.breakdownCard}>
                <View style={styles.breakdownTop}>
                  <View style={styles.breakdownCopy}>
                    <AppText variant="micro" dimmed>
                      Calories
                    </AppText>
                    <AppText variant="headline">
                      {nutritionSummary.calories.toLocaleString()}/
                      {state.goals.calories.toLocaleString()}
                    </AppText>
                  </View>
                  <IconRing
                    progress={nutritionSummary.calories / state.goals.calories}
                    color={AppColors.text}
                    icon="flame"
                    size={74}
                    strokeWidth={8}
                  />
                </View>

                <View style={styles.breakdownRows}>
                  <BreakdownRow
                    label="Protein"
                    value={`${nutritionSummary.protein}/${state.goals.protein}g`}
                    progress={nutritionSummary.protein / state.goals.protein}
                    iconKey={MACRO_META.protein.key}
                    color={MACRO_META.protein.color}
                  />
                  <BreakdownRow
                    label="Carbs"
                    value={`${nutritionSummary.carbs}/${state.goals.carbs}g`}
                    progress={nutritionSummary.carbs / state.goals.carbs}
                    iconKey={MACRO_META.carbs.key}
                    color={MACRO_META.carbs.color}
                  />
                  <BreakdownRow
                    label="Fats"
                    value={`${nutritionSummary.fats}/${state.goals.fats}g`}
                    progress={nutritionSummary.fats / state.goals.fats}
                    iconKey={MACRO_META.fats.key}
                    color={MACRO_META.fats.color}
                  />
                </View>
              </SurfaceCard>
            </View>

            <View style={[styles.page, { width: cardWidth }]}>
              <SurfaceCard floating style={styles.loggedMealsCard}>
                <View style={styles.loggedMealsHeader}>
                  <View style={styles.loggedMealsHeaderCopy}>
                    <AppText variant="title">Logged meals</AppText>
                    <View style={styles.loggedMealsBadge}>
                      <AppText variant="label" color={AppColors.primary}>
                        {todaysMeals.length} today
                      </AppText>
                    </View>
                    {todaysMeals.length > 0 ? (
                      <PressScale haptic="none" onPress={handleClearAllMeals}>
                        <View style={styles.clearAllMealsButton}>
                          <AppText variant="label" color={AppColors.danger}>
                            Clear all
                          </AppText>
                        </View>
                      </PressScale>
                    ) : null}
                  </View>
                  <PressScale haptic="none" onPress={handleCustomMealOpen}>
                    <View style={styles.customMealButton}>
                      <Ionicons name="add" size={18} color={AppColors.primary} />
                    </View>
                  </PressScale>
                </View>
                {todaysMeals.length > 0 ? (
                  <ScrollView
                    style={styles.loggedMealsScroller}
                    contentContainerStyle={styles.loggedMealsList}
                    showsVerticalScrollIndicator={false}>
                    {todaysMeals.map((meal, index) => (
                      <PressScale
                        key={meal.id}
                        haptic="none"
                        onPress={() => handleMealLogEdit(meal)}>
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
                ) : (
                  <View style={styles.loggedMealsEmpty}>
                    <AppText variant="bodyStrong">Nothing logged yet</AppText>
                    <AppText dimmed>
                      Use the plus button for a custom entry or open a hall to log from the live
                      UCLA menu.
                    </AppText>
                  </View>
                )}
              </SurfaceCard>
            </View>
          </ScrollView>

          <View style={styles.pageDots}>
            {[0, 1].map((index) => (
              <View
                key={index}
                style={[
                  styles.pageDot,
                  activeSlide === index ? styles.pageDotActive : null,
                ]}
              />
            ))}
          </View>
        </View>

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
        activeItem={selectedMenuItem}
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
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [showAllNutritionFacts, setShowAllNutritionFacts] = useState(false);
  const [customizationQuantities, setCustomizationQuantities] = useState<Record<string, number>>(
    {},
  );
  const activePeriodLabel = getPeriodLabel(activePeriod);
  const nutritionFacts = activeItem ? getDetailNutritionFacts(activeItem) : [];
  const visibleNutritionFacts = showAllNutritionFacts
    ? nutritionFacts
    : nutritionFacts.slice(0, 6);
  const visibleIngredients = showAllIngredients
    ? activeItem?.ingredients ?? []
    : (activeItem?.ingredients ?? []).slice(0, 4);
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
    setShowAllIngredients(false);
    setShowAllNutritionFacts(false);
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
                        <View style={styles.menuItemTopRow}>
                          <View style={styles.menuItemCopy}>
                            <AppText numberOfLines={2} variant="bodyStrong">
                              {item.itemName}
                            </AppText>
                          </View>
                          <PressScale
                            haptic="none"
                            onPress={() => onOpenItem(item)}>
                            <View style={styles.menuAddButtonCompact}>
                              <Ionicons name="add" size={17} color={AppColors.primary} />
                            </View>
                          </PressScale>
                        </View>
                        <View style={styles.menuItemBottomRow}>
                          <AppText
                            numberOfLines={1}
                            style={styles.menuItemNutritionLabel}
                            variant="micro"
                            dimmed>
                            {formatInlineMacros(item)}
                          </AppText>
                          {item.badgeLabels.length > 0 ? (
                            <View style={styles.menuBadgeRow}>
                              {item.badgeLabels.slice(0, 5).map((badge) => (
                                <MenuBadge key={`${item.itemName}-${badge}`} label={badge} />
                              ))}
                            </View>
                          ) : null}
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

                    <View style={styles.buildYourOwnSummary}>
                      <BuildYourOwnMetric
                        label="kcal"
                        value={customizationTotals.calories.toString()}
                      />
                      <BuildYourOwnMetric
                        label="Protein"
                        value={`${customizationTotals.protein}g`}
                      />
                      <BuildYourOwnMetric
                        label="Carbs"
                        value={`${customizationTotals.carbs}g`}
                      />
                      <BuildYourOwnMetric
                        label="Fat"
                        value={`${customizationTotals.fats}g`}
                      />
                    </View>

                    <View style={styles.buildYourOwnIntro}>
                      <AppText variant="title">Select your ingredients</AppText>
                      <AppText dimmed>
                        Pick the components you want, then add the configured meal.
                      </AppText>
                    </View>

                    <View style={styles.buildYourOwnOptionsList}>
                      {activeItem.customizationOptions.map((option) => {
                        const optionKey = getCustomizationOptionKey(option);
                        const selectedQuantity = customizationQuantities[optionKey] ?? 0;
                        const isSelected = selectedQuantity > 0;

                        return (
                          <View key={optionKey} style={styles.buildYourOwnOptionCard}>
                            <PressScale
                              haptic="none"
                              onPress={() => handleCustomizationToggle(option)}>
                              <View style={styles.buildYourOwnOptionTopRow}>
                                <View style={styles.buildYourOwnOptionCopy}>
                                  <AppText variant="title">{option.itemName}</AppText>
                                  <AppText dimmed>{formatCustomizationOptionMeta(option)}</AppText>
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

                    <View
                      style={[
                        styles.buildYourOwnAddButton,
                        selectedCustomizationCount === 0
                          ? styles.buildYourOwnAddButtonDisabled
                          : null,
                      ]}>
                      <PressScale
                        haptic="none"
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
                  </ScrollView>
                </KeyboardAvoidingView>
              ) : (
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={styles.itemSheetCard}>
                  <ScrollView
                    bounces={false}
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
                      <DetailTag label={activePeriodLabel} tone="primary" />
                      <AppText variant="micro" dimmed>
                        {activeItem.servingSize
                          ? `Serving • ${activeItem.servingSize}`
                          : 'Serving details unavailable'}
                      </AppText>
                    </View>

                    {activeItem.badgeLabels.length > 0 ? (
                      <View style={styles.itemSheetBadgeRow}>
                        {activeItem.badgeLabels.map((badge) => (
                          <MenuBadge key={`${activeItem.itemName}-${badge}-detail`} label={badge} />
                        ))}
                      </View>
                    ) : null}

                    <View style={styles.servingsRow}>
                      <AppText variant="title">Servings</AppText>
                      <View style={styles.stepper}>
                        <StepperButton
                          icon="remove"
                          onPress={() => onServingsChange(Math.max(1, servings - 1))}
                        />
                        <AppText variant="headline">{servings}</AppText>
                        <StepperButton icon="add" onPress={() => onServingsChange(servings + 1)} />
                      </View>
                    </View>

                    <View style={styles.sheetMacroGrid}>
                      <MacroMetric label="Calories" value={`${selectedItemTotals.calories} cal`} />
                      <MacroMetric label="Protein" value={`${selectedItemTotals.protein}g`} />
                      <MacroMetric label="Carbs" value={`${selectedItemTotals.carbs}g`} />
                      <MacroMetric label="Fat" value={`${selectedItemTotals.fats}g`} />
                    </View>

                    {nutritionFacts.length > 0 ? (
                      <View style={styles.detailSection}>
                        <View style={styles.detailSectionHeader}>
                          <AppText variant="title">Nutrition facts</AppText>
                          {nutritionFacts.length > 6 ? (
                            <DetailToggleButton
                              label={
                                showAllNutritionFacts
                                  ? 'Show less'
                                  : `Show all ${nutritionFacts.length}`
                              }
                              onPress={() =>
                                setShowAllNutritionFacts((currentValue) => !currentValue)
                              }
                            />
                          ) : null}
                        </View>
                        <View style={styles.nutritionFactGrid}>
                          {visibleNutritionFacts.map((fact) => (
                            <NutritionFactChip key={fact.id} fact={fact} />
                          ))}
                        </View>
                      </View>
                    ) : null}

                    {activeItem.allergenLabels.length > 0 ? (
                      <View style={styles.detailSection}>
                        <AppText variant="title">Allergens</AppText>
                        <View style={styles.detailTagWrap}>
                          {activeItem.allergenLabels.map((label) => (
                            <DetailTag key={`${activeItem.itemName}-${label}`} label={label} tone="warning" />
                          ))}
                        </View>
                      </View>
                    ) : null}

                    {activeItem.ingredients.length > 0 ? (
                      <View style={styles.detailSection}>
                        <View style={styles.detailSectionHeader}>
                          <AppText variant="title">Ingredients</AppText>
                          {activeItem.ingredients.length > 4 ? (
                            <DetailToggleButton
                              label={
                                showAllIngredients
                                  ? 'Show less'
                                  : `Show all ${activeItem.ingredients.length}`
                              }
                              onPress={() =>
                                setShowAllIngredients((currentValue) => !currentValue)
                              }
                            />
                          ) : null}
                        </View>
                        <View style={styles.ingredientList}>
                          {visibleIngredients.map((ingredient) => (
                            <View
                              key={`${activeItem.itemName}-${ingredient}`}
                              style={styles.ingredientRow}>
                              <View style={styles.ingredientBullet} />
                              <AppText style={styles.ingredientText}>{ingredient}</AppText>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}

                    <ActionButton
                      label={`Add ${servings} serving${servings > 1 ? 's' : ''} to Meal`}
                      onPress={() => onSaveItem()}
                    />
                  </ScrollView>
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
                <AppText dimmed>
                  {editingMeal
                    ? 'Adjust this meal log or remove it from today.'
                    : 'Log something that isn’t on the UCLA menu.'}
                </AppText>
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
              placeholder="Chicken bowl, Trader Joe's wrap, protein shake..."
              value={draft.title}
            />

            <View style={styles.customMacroGrid}>
              <InputField
                keyboardType="numbers-and-punctuation"
                label="Calories"
                onChangeText={(value) => onChange({ ...draft, calories: value })}
                placeholder="420"
                value={draft.calories}
              />
              <InputField
                keyboardType="numbers-and-punctuation"
                label="Protein"
                onChangeText={(value) => onChange({ ...draft, protein: value })}
                placeholder="35"
                value={draft.protein}
              />
              <InputField
                keyboardType="numbers-and-punctuation"
                label="Carbs"
                onChangeText={(value) => onChange({ ...draft, carbs: value })}
                placeholder="42"
                value={draft.carbs}
              />
              <InputField
                keyboardType="numbers-and-punctuation"
                label="Fat"
                onChangeText={(value) => onChange({ ...draft, fats: value })}
                placeholder="12"
                value={draft.fats}
              />
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
  return (
    <PressScale haptic="none" onPress={onPress}>
      <View style={styles.stepperButton}>
        <Ionicons name={icon} size={18} color={AppColors.text} />
      </View>
    </PressScale>
  );
}

function MacroMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <AppText variant="headline">{value}</AppText>
      <AppText dimmed>{label}</AppText>
    </View>
  );
}

function BuildYourOwnMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.buildYourOwnMetric}>
      <AppText variant="headline">{value}</AppText>
      <AppText dimmed>{label}</AppText>
    </View>
  );
}

function NutritionFactChip({ fact }: { fact: DiningNutritionFact }) {
  return (
    <View style={styles.nutritionFactChip}>
      <AppText variant="bodyStrong">{fact.value}</AppText>
      <AppText variant="micro" dimmed>
        {fact.label}
        {fact.dailyValuePercent !== null ? ` • ${fact.dailyValuePercent}% DV` : ''}
      </AppText>
    </View>
  );
}

function MenuBadge({ label }: { label: string }) {
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

function DetailToggleButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <PressScale haptic="none" onPress={onPress}>
      <View style={styles.detailToggleButton}>
        <AppText variant="label" color={AppColors.primary}>
          {label}
        </AppText>
      </View>
    </PressScale>
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
  return (
    <PressScale onPress={onPress}>
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
  return (
    <View style={[styles.iconRingWrap, { width: size, height: size }]}>
      <ProgressRing
        progress={progress}
        value=""
        unit=""
        caption=""
        size={size}
        strokeWidth={strokeWidth}
        color={color}
        trackColor="#ECECF4"
        hideLabel
      />
      <View style={styles.iconRingCenter}>
        <Ionicons name={icon} size={14} color={color} />
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
  const hours = hall.hours[selectedPeriod];

  return (
    <PressScale haptic="none" onPress={onPress}>
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
            <View style={styles.hallMetaCopy}>
              <AppText variant="headline" color={AppColors.primary}>
                {hall.fitPercent}%
              </AppText>
              <AppText variant="micro" dimmed>
                full
              </AppText>
            </View>
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

function parseMealNumber(value: string) {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : Number.NaN;
}

function getMenuItemTotals(item: DiningMenuItem, servings: number) {
  const normalizedServings = Math.max(1, servings);

  return {
    calories: Math.round((item.calories ?? 0) * normalizedServings),
    protein: Math.round((item.proteinG ?? 0) * normalizedServings),
    carbs: Math.round((item.carbsG ?? 0) * normalizedServings),
    fats: Math.round((item.fatsG ?? 0) * normalizedServings),
  };
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

  return `${item.calories ?? 0} cal • P ${item.proteinG ?? 0}g • C ${item.carbsG ?? 0}g • F ${item.fatsG ?? 0}g`;
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

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.sm,
  },
  header: {
    paddingTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  carouselWrap: {
    gap: Spacing.md,
  },
  page: {
    gap: Spacing.sm,
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
    backgroundColor: AppColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedMealsCard: {
    height: 292,
    gap: Spacing.lg,
  },
  loggedMealsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  loggedMealsHeaderCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    flex: 1,
  },
  loggedMealsBadge: {
    minHeight: 32,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    backgroundColor: AppColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAllMealsButton: {
    minHeight: 32,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FDEDEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customMealButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedMealsScroller: {
    flex: 1,
  },
  loggedMealsList: {
    gap: Spacing.md,
    paddingRight: Spacing.xs,
  },
  loggedMealsEmpty: {
    minHeight: 160,
    justifyContent: 'center',
    gap: Spacing.sm,
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
    borderBottomColor: AppColors.outlineVariant,
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
    backgroundColor: AppColors.surfaceLow,
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
    backgroundColor: AppColors.text,
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
    backgroundColor: AppColors.primary,
  },
  periodChipDefault: {
    backgroundColor: AppColors.surfaceLow,
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
    backgroundColor: AppColors.background,
  },
  menuModalCard: {
    flex: 1,
  },
  menuModalHeader: {
    paddingHorizontal: Layout.pagePadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  menuHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  menuHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLow,
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
    borderColor: AppColors.outlineVariant,
    backgroundColor: AppColors.surfaceLowest,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuSearchInput: {
    flex: 1,
    color: AppColors.text,
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
    backgroundColor: AppColors.surfaceLowest,
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  menuItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuItemCopy: {
    flex: 1,
    gap: 2,
  },
  menuItemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    justifyContent: 'space-between',
  },
  menuBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  menuBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBadgeImage: {
    width: 22,
    height: 22,
  },
  menuBadgeText: {
    letterSpacing: 0,
  },
  menuItemNutritionLabel: {
    flex: 1,
  },
  menuAddButtonCompact: {
    width: 30,
    height: 30,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLow,
    borderWidth: 1,
    borderColor: AppColors.outlineVariant,
  },
  menuEmptyState: {
    backgroundColor: AppColors.surfaceLowest,
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
    backgroundColor: AppColors.surfaceLowest,
    maxHeight: '82%',
  },
  buildYourOwnContent: {
    paddingHorizontal: Layout.pagePadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  itemSheetContent: {
    paddingHorizontal: Layout.pagePadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  sheetGrabber: {
    width: 56,
    height: 5,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceHighest,
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
  itemSheetBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetCloseButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsRow: {
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
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetMacroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  buildYourOwnSummary: {
    flexDirection: 'row',
    backgroundColor: AppColors.surfaceLow,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  buildYourOwnMetric: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  buildYourOwnIntro: {
    gap: Spacing.xs,
    alignItems: 'center',
  },
  buildYourOwnOptionsList: {
    gap: Spacing.md,
  },
  buildYourOwnOptionCard: {
    backgroundColor: AppColors.surfaceLow,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
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
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLowest,
  },
  buildYourOwnOptionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  buildYourOwnAddButton: {
    borderRadius: Radii.pill,
    backgroundColor: AppColors.primary,
    overflow: 'hidden',
  },
  buildYourOwnAddButtonDisabled: {
    backgroundColor: AppColors.surfaceHighest,
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
    backgroundColor: AppColors.surfaceLow,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
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
  nutritionFactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  nutritionFactChip: {
    width: '47%',
    backgroundColor: AppColors.surfaceLow,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  detailTagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  detailTag: {
    minHeight: 32,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLow,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTagPrimary: {
    backgroundColor: AppColors.secondaryContainer,
  },
  detailTagWarning: {
    backgroundColor: '#FFF0C6',
  },
  detailToggleButton: {
    minHeight: 32,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLow,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientList: {
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
    backgroundColor: AppColors.primary,
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
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  customPeriodChip: {
    minHeight: 36,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    backgroundColor: AppColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customPeriodChipSelected: {
    backgroundColor: AppColors.primary,
  },
  sheetInput: {
    minHeight: 48,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: AppColors.outlineVariant,
    paddingHorizontal: Spacing.md,
    color: AppColors.text,
    backgroundColor: AppColors.surfaceLowest,
  },
  customMacroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
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
