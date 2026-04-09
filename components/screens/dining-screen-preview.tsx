import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useDeferredValue, useMemo, useState } from 'react';
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
  getNutritionSummaryForDate,
  getRecentMealLogs,
} from '@/data/local/selectors';
import {
  formatPublicDataStatus,
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
  DiningMenuItem,
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

type PeriodKey = (typeof PERIODS)[number]['key'];
type CustomMealDraft = {
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

export function DiningScreenPreview() {
  const { width } = useWindowDimensions();
  const {
    addCustomMealLog,
    addDiningMealLog,
    setPreferredDiningPeriod,
    state,
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
  const [activeHallId, setActiveHallId] = useState<string | null>(null);
  const [activeHallPeriod, setActiveHallPeriod] = useState<PeriodKey>(selectedPeriod);
  const [hallSearchQuery, setHallSearchQuery] = useState('');
  const [selectedMenuItem, setSelectedMenuItem] = useState<DiningMenuItem | null>(null);
  const [selectedServings, setSelectedServings] = useState(1);
  const deferredHallSearchQuery = useDeferredValue(hallSearchQuery.trim().toLowerCase());
  const nutritionSummary = getNutritionSummaryForDate(state);
  const recentMeals = getRecentMealLogs(state);
  const diningStatus = formatPublicDataStatus(
    diningHallState.updatedAt,
    diningHallState.source,
    diningHallState.isStale,
  );
  const menuStatus = formatPublicDataStatus(
    diningMenuState.updatedAt,
    diningMenuState.source,
    diningMenuState.isStale,
  );

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

  const menuItemCounts = useMemo(() => {
    const counts = new Map<string, number>();

    diningMenuState.data.forEach((item) => {
      const key = `${item.hallId}:${item.mealPeriod}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return counts;
  }, [diningMenuState.data]);

  const activeHall = useMemo(
    () => diningHallState.data.find((hall) => hall.id === activeHallId) ?? null,
    [activeHallId, diningHallState.data],
  );

  const activeHallItems = useMemo(
    () =>
      activeHallId
        ? diningMenuState.data.filter((item) => item.hallId === activeHallId)
        : [],
    [activeHallId, diningMenuState.data],
  );

  const availableHallPeriods = useMemo(() => {
    return PERIODS.filter((period) =>
      activeHallItems.some((item) => item.mealPeriod === period.key),
    );
  }, [activeHallItems]);

  const resolvedHallPeriod = availableHallPeriods.some(
    (period) => period.key === activeHallPeriod,
  )
    ? activeHallPeriod
    : availableHallPeriods[0]?.key ?? selectedPeriod;

  const activeHallSections = useMemo(() => {
    const scopedItems = activeHallItems.filter((item) => {
      if (item.mealPeriod !== resolvedHallPeriod) {
        return false;
      }

      if (!deferredHallSearchQuery) {
        return true;
      }

      return (
        item.itemName.toLowerCase().includes(deferredHallSearchQuery) ||
        item.stationName.toLowerCase().includes(deferredHallSearchQuery)
      );
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
  }, [activeHallItems, deferredHallSearchQuery, resolvedHallPeriod]);

  const activeHallDateLabel = useMemo(() => {
    const referenceItem =
      activeHallItems.find((item) => item.mealPeriod === resolvedHallPeriod) ??
      activeHallItems[0];

    return referenceItem ? formatMenuServiceDate(referenceItem.serviceDate) : 'Menu unavailable';
  }, [activeHallItems, resolvedHallPeriod]);

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

    addCustomMealLog({
      title,
      period: customMealDraft.period,
      calories,
      protein,
      carbs,
      fats,
    });
    setCustomMealOpen(false);
  };

  const handleHallOpen = (hall: PublicDiningHall) => {
    setActiveHallId(hall.id);
    setActiveHallPeriod(selectedPeriod);
    setHallSearchQuery('');
    setSelectedMenuItem(null);
    setSelectedServings(1);
  };

  const handleDiningItemSave = () => {
    if (!selectedMenuItem) {
      return;
    }

    addDiningMealLog({
      item: selectedMenuItem,
      servings: selectedServings,
    });
    setSelectedMenuItem(null);
    setSelectedServings(1);
  };

  return (
    <>
      <AppScreen contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText variant="headline">Dining</AppText>
          <AppText variant="micro" dimmed>
            {diningStatus}
          </AppText>
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
                        {recentMeals.length} today
                      </AppText>
                    </View>
                  </View>
                  <PressScale haptic="none" onPress={handleCustomMealOpen}>
                    <View style={styles.customMealButton}>
                      <Ionicons name="add" size={18} color={AppColors.primary} />
                    </View>
                  </PressScale>
                </View>
                {recentMeals.length > 0 ? (
                  <View style={styles.loggedMealsList}>
                    {recentMeals.map((meal, index) => (
                      <View
                        key={meal.id}
                        style={[
                          styles.loggedMealRow,
                          index < recentMeals.length - 1 ? styles.rowSpacing : null,
                        ]}>
                        <View style={styles.loggedMealCopy}>
                          <AppText variant="bodyStrong">{meal.title}</AppText>
                          <AppText variant="micro" dimmed>
                            {formatMealLogMeta(meal)}
                          </AppText>
                        </View>
                        <AppText variant="title" color={AppColors.primary}>
                          {meal.calories}
                        </AppText>
                      </View>
                    ))}
                  </View>
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
                menuItemCount={menuItemCounts.get(`${hall.id}:${selectedPeriod}`) ?? 0}
                onPress={() => handleHallOpen(hall)}
                selectedPeriod={selectedPeriod}
              />
            ))}
          </View>
        </View>
      </AppScreen>

      <DiningHallModal
        activeItem={selectedMenuItem}
        activePeriod={resolvedHallPeriod}
        dateLabel={activeHallDateLabel}
        hall={activeHall}
        isLoading={diningMenuState.isLoading && activeHallItems.length === 0}
        menuError={diningMenuState.error}
        menuSections={activeHallSections}
        menuStatus={menuStatus}
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
        onPeriodChange={(period) => {
          setActiveHallPeriod(period);
          setSelectedMenuItem(null);
          setSelectedServings(1);
        }}
        onSaveItem={handleDiningItemSave}
        onSearchChange={setHallSearchQuery}
        onServingsChange={setSelectedServings}
        periods={availableHallPeriods}
        searchQuery={hallSearchQuery}
        selectedItemTotals={selectedItemTotals}
        servings={selectedServings}
      />

      <CustomMealComposer
        draft={customMealDraft}
        isOpen={customMealOpen}
        onChange={setCustomMealDraft}
        onClose={() => setCustomMealOpen(false)}
        onSave={handleCustomMealSave}
      />
    </>
  );
}

function DiningHallModal({
  activeItem,
  activePeriod,
  dateLabel,
  hall,
  isLoading,
  menuError,
  menuSections,
  menuStatus,
  onClose,
  onOpenItem,
  onCloseItem,
  onPeriodChange,
  onSaveItem,
  onSearchChange,
  onServingsChange,
  periods,
  searchQuery,
  selectedItemTotals,
  servings,
}: {
  activeItem: DiningMenuItem | null;
  activePeriod: PeriodKey;
  dateLabel: string;
  hall: PublicDiningHall | null;
  isLoading: boolean;
  menuError: string | null;
  menuSections: DiningMenuSection[];
  menuStatus: string;
  onClose: () => void;
  onOpenItem: (item: DiningMenuItem) => void;
  onCloseItem: () => void;
  onPeriodChange: (period: PeriodKey) => void;
  onSaveItem: () => void;
  onSearchChange: (value: string) => void;
  onServingsChange: (value: number) => void;
  periods: readonly (typeof PERIODS)[number][];
  searchQuery: string;
  selectedItemTotals: ReturnType<typeof getMenuItemTotals> | null;
  servings: number;
}) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={Boolean(hall)}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.menuModalRoot}>
        <View style={styles.menuModalBackdrop} />
        <View style={styles.menuModalCard}>
          <View style={styles.menuModalHeader}>
            <View style={styles.menuHeaderTop}>
              <PressScale haptic="none" onPress={onClose}>
                <View style={styles.menuHeaderButton}>
                  <Ionicons name="close" size={22} color={AppColors.white} />
                </View>
              </PressScale>
              <View style={styles.menuHeaderCopy}>
                <AppText variant="headline" color={AppColors.white}>
                  {hall?.name ?? 'Dining hall'}
                </AppText>
                <AppText variant="body" color="rgba(255,255,255,0.72)">
                  {dateLabel}
                </AppText>
              </View>
              <View style={styles.menuHeaderSpacer} />
            </View>

            <View style={styles.menuHeaderMeta}>
              <AppText variant="micro" color="rgba(255,255,255,0.72)">
                {menuStatus}
              </AppText>
            </View>

            <View style={styles.menuPeriodRow}>
              {periods.map((period) => (
                <ModalPeriodChip
                  key={period.key}
                  label={period.label}
                  onPress={() => onPeriodChange(period.key)}
                  selected={period.key === activePeriod}
                />
              ))}
            </View>

            <View style={styles.menuSearchShell}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.52)" />
              <TextInput
                placeholder="Search items or stations"
                placeholderTextColor="rgba(255,255,255,0.4)"
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
                <AppText variant="bodyStrong">Loading live menu</AppText>
                <AppText color="rgba(255,255,255,0.72)">
                  Pulling the latest UCLA items and macros from Supabase.
                </AppText>
              </SurfaceCard>
            ) : menuSections.length > 0 ? (
              menuSections.map((section) => (
                <View key={section.stationName} style={styles.menuSection}>
                  <AppText variant="headline" color={AppColors.white}>
                    {section.stationName}
                  </AppText>
                  <View style={styles.menuItemsList}>
                    {section.items.map((item) => (
                      <PressScale
                        key={`${item.stationName}-${item.itemOrder}-${item.itemName}`}
                        haptic="none"
                        onPress={() => onOpenItem(item)}>
                        <SurfaceCard style={styles.menuItemCard}>
                          <View style={styles.menuItemCopy}>
                            <AppText variant="title" color={AppColors.white}>
                              {item.itemName}
                            </AppText>
                            <AppText variant="body" color="rgba(255,255,255,0.64)">
                              {formatInlineMacros(item)}
                            </AppText>
                          </View>
                          <View style={styles.menuItemRight}>
                            <PressScale haptic="none" onPress={() => onOpenItem(item)}>
                              <View style={styles.menuInfoButton}>
                                <Ionicons
                                  name="information-circle-outline"
                                  size={20}
                                  color="rgba(255,255,255,0.52)"
                                />
                              </View>
                            </PressScale>
                            <PressScale haptic="none" onPress={() => onOpenItem(item)}>
                              <View style={styles.menuAddButton}>
                                <Ionicons name="add" size={20} color={AppColors.white} />
                              </View>
                            </PressScale>
                          </View>
                        </SurfaceCard>
                      </PressScale>
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <SurfaceCard style={styles.menuEmptyState}>
                <AppText variant="bodyStrong">No menu items here yet</AppText>
                <AppText color="rgba(255,255,255,0.72)">
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
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.itemSheetCard}>
                <View style={styles.sheetGrabber} />
                <View style={styles.itemSheetHeader}>
                  <View style={styles.itemSheetCopy}>
                    <AppText variant="headline">{activeItem.itemName}</AppText>
                    <AppText dimmed>
                      {activeItem.hallName} • {activeItem.stationName}
                    </AppText>
                    <AppText dimmed>
                      {activeItem.servingSize
                        ? `Per serving: ${activeItem.servingSize}`
                        : 'Per serving'}
                    </AppText>
                  </View>
                  <PressScale haptic="none" onPress={onCloseItem}>
                    <View style={styles.sheetCloseButton}>
                      <Ionicons name="close" size={20} color={AppColors.text} />
                    </View>
                  </PressScale>
                </View>

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
                  <MacroMetric label="Calories" value={`${selectedItemTotals.calories} kcal`} />
                  <MacroMetric label="Protein" value={`${selectedItemTotals.protein}g`} />
                  <MacroMetric label="Carbs" value={`${selectedItemTotals.carbs}g`} />
                  <MacroMetric label="Fat" value={`${selectedItemTotals.fats}g`} />
                </View>

                <ActionButton
                  label={`Add ${servings} serving${servings > 1 ? 's' : ''} to Meal`}
                  onPress={onSaveItem}
                />
              </KeyboardAvoidingView>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function CustomMealComposer({
  draft,
  isOpen,
  onChange,
  onClose,
  onSave,
}: {
  draft: CustomMealDraft;
  isOpen: boolean;
  onChange: (draft: CustomMealDraft) => void;
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
                <AppText variant="headline">Custom meal</AppText>
                <AppText dimmed>Log something that isn’t on the UCLA menu.</AppText>
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

            <ActionButton label="Save custom meal" onPress={onSave} />
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

function ModalPeriodChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <PressScale onPress={onPress} containerStyle={styles.modalPeriodPress}>
      <View
        style={[
          styles.modalPeriodChip,
          selected ? styles.modalPeriodChipSelected : null,
        ]}>
        <AppText
          variant="label"
          color={selected ? AppColors.text : 'rgba(255,255,255,0.68)'}>
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
  menuItemCount,
  onPress,
  selectedPeriod,
}: {
  hall: PublicDiningHall;
  menuItemCount: number;
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
          <AppText variant="micro" dimmed>
            {menuItemCount > 0
              ? `${menuItemCount} live items`
              : 'Menu sync still pending'}
          </AppText>
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

function createCustomMealDraft(period: MealLogPeriod): CustomMealDraft {
  return {
    title: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    period,
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

function formatInlineMacros(item: DiningMenuItem) {
  if (
    item.calories === null &&
    item.proteinG === null &&
    item.carbsG === null &&
    item.fatsG === null
  ) {
    return 'Nutrition unavailable';
  }

  return `${item.calories ?? 0} kcal • P ${item.proteinG ?? 0}g • C ${item.carbsG ?? 0}g • F ${item.fatsG ?? 0}g`;
}

function formatMenuServiceDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
  }).format(date);
  const todayParts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const todayValues = Object.fromEntries(todayParts.map((part) => [part.type, part.value]));
  const today = `${todayValues.year}-${todayValues.month}-${todayValues.day}`;

  return value === today ? `Today, ${formatted}` : formatted;
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
    minHeight: 280,
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
  customMealButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedMealsList: {
    gap: Spacing.md,
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
    backgroundColor: AppColors.text,
  },
  periodChipDefault: {
    backgroundColor: AppColors.surfaceLowest,
  },
  list: {
    gap: Spacing.md,
  },
  hallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  hallImage: {
    width: 72,
    height: 48,
  },
  hallCopy: {
    flex: 1,
    gap: Spacing.xs,
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
    backgroundColor: 'rgba(7, 10, 13, 0.92)',
  },
  menuModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 13, 0.92)',
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
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuHeaderCopy: {
    flex: 1,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  menuHeaderSpacer: {
    width: 42,
    height: 42,
  },
  menuHeaderMeta: {
    alignItems: 'center',
  },
  menuPeriodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalPeriodPress: {
    flex: 1,
  },
  modalPeriodChip: {
    minHeight: 42,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPeriodChipSelected: {
    backgroundColor: AppColors.surfaceLowest,
  },
  menuSearchShell: {
    minHeight: 52,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuSearchInput: {
    flex: 1,
    color: AppColors.white,
    fontSize: 16,
    paddingVertical: 0,
  },
  menuModalScrollContent: {
    paddingHorizontal: Layout.pagePadding,
    paddingBottom: 220,
    gap: Spacing.xxl,
  },
  menuSection: {
    gap: Spacing.md,
  },
  menuItemsList: {
    gap: Spacing.md,
  },
  menuItemCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuInfoButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  menuAddButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
  },
  menuEmptyState: {
    backgroundColor: 'rgba(255,255,255,0.08)',
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
  metricCard: {
    width: '47%',
    backgroundColor: AppColors.surfaceLow,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
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
});
