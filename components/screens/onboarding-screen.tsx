import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { AppColors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { calculateGoalTargets } from '@/lib/goal-calculator';
import {
  getRecommendedStarterPackId,
  STARTER_TEMPLATE_PACKS,
  type StarterTemplatePackId,
} from '@/lib/starter-template-packs';
import { useAppData } from '@/providers/app-data-provider';
import type {
  ProfileActivityLevel,
  ProfileNutritionGoal,
  ProfileSex,
} from '@/types/app-data';

type OnboardingDraft = {
  activityLevel: ProfileActivityLevel | null;
  age: number | null;
  caloriesTarget: string;
  carbsTarget: string;
  fatsTarget: string;
  heightInches: number | null;
  nutritionGoal: ProfileNutritionGoal | null;
  proteinTarget: string;
  selectedPackIds: StarterTemplatePackId[];
  sex: ProfileSex | null;
  weightPounds: number | null;
  workoutsPerWeek: number | null;
};

type StepId =
  | 'sex'
  | 'age'
  | 'height'
  | 'weight'
  | 'activity'
  | 'goal'
  | 'frequency'
  | 'packs'
  | 'summary';

const STEPS: StepId[] = [
  'sex',
  'age',
  'height',
  'weight',
  'activity',
  'goal',
  'frequency',
  'packs',
  'summary',
];

const ONBOARDING_SPLASH_IMAGE = require('../../appassets/onboardingsplashscreenv2.png');
const ONBOARDING_LOGO_IMAGE = require('../../appassets/bruingains app icons.png');
const SEX_OPTIONS: {
  description?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  value: ProfileSex;
}[] = [
  {
    value: 'male',
    title: 'Male',
    iconName: 'male-outline',
  },
  {
    value: 'female',
    title: 'Female',
    iconName: 'female-outline',
  },
  {
    value: 'other',
    title: 'Other',
    iconName: 'person-outline',
  },
];

const ACTIVITY_OPTIONS: {
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  value: ProfileActivityLevel;
}[] = [
  {
    value: 'inactive',
    title: 'Mostly sedentary',
    description: 'Mostly sitting.',
    iconName: 'desktop-outline',
  },
  {
    value: 'low_active',
    title: 'Lightly active',
    description: 'Some walking and training.',
    iconName: 'walk-outline',
  },
  {
    value: 'active',
    title: 'Active',
    description: 'Training most weeks.',
    iconName: 'barbell-outline',
  },
  {
    value: 'very_active',
    title: 'Very active',
    description: 'High training load.',
    iconName: 'flash-outline',
  },
];

const GOAL_OPTIONS: {
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  value: ProfileNutritionGoal;
}[] = [
  {
    value: 'cut',
    title: 'Cut',
    description: 'Lose body fat.',
    iconName: 'trending-down-outline',
  },
  {
    value: 'maintain',
    title: 'Maintain',
    description: 'Stay steady.',
    iconName: 'remove-outline',
  },
  {
    value: 'lean_bulk',
    title: 'Lean bulk',
    description: 'Slow gain.',
    iconName: 'trending-up-outline',
  },
  {
    value: 'bulk',
    title: 'Bulk',
    description: 'Push size up.',
    iconName: 'arrow-up-outline',
  },
];

const FREQUENCY_OPTIONS: {
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  value: number;
}[] = [
  {
    value: 2,
    title: '0-2',
    description: 'A few sessions.',
    iconName: 'partly-sunny-outline',
  },
  {
    value: 4,
    title: '3-4',
    description: 'Most common split.',
    iconName: 'calendar-outline',
  },
  {
    value: 6,
    title: '5-6',
    description: 'High consistency.',
    iconName: 'barbell-outline',
  },
  {
    value: 7,
    title: '6+',
    description: 'Training-focused.',
    iconName: 'flame-outline',
  },
];

function toFeetAndInches(totalInches: number) {
  const rounded = Math.max(48, Math.round(totalInches));

  return {
    feet: Math.floor(rounded / 12),
    inches: rounded % 12,
  };
}

function getStepSubtitle(step: StepId) {
  if (step === 'sex') {
    return 'For your targets.';
  }

  if (step === 'age') {
    return 'For your targets.';
  }

  if (step === 'height') {
    return 'Choose your height.';
  }

  if (step === 'weight') {
    return 'Choose your weight.';
  }

  if (step === 'activity') {
    return 'Your normal week.';
  }

  if (step === 'goal') {
    return 'Choose direction.';
  }

  if (step === 'frequency') {
    return 'Weekly goal.';
  }

  if (step === 'packs') {
    return 'Prefills workouts.';
  }

  return 'Adjust before you start.';
}

function buildProgress(stepIndex: number) {
  return (stepIndex + 1) / STEPS.length;
}

const WHEEL_ITEM_HEIGHT = 56;
const WHEEL_VISIBLE_ROWS = 5;
const WHEEL_FRAME_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS;
const WHEEL_VERTICAL_PADDING = (WHEEL_FRAME_HEIGHT - WHEEL_ITEM_HEIGHT) / 2;

type WheelItem = {
  label: string;
  value: number;
};

function WheelPicker({
  items,
  onChange,
  selectedValue,
  style,
}: {
  items: WheelItem[];
  onChange: (value: number) => void;
  selectedValue: number;
  style?: StyleProp<ViewStyle>;
}) {
  const scrollRef = useRef<ScrollView | null>(null);
  const lastCommittedValueRef = useRef(selectedValue);
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === selectedValue),
  );

  useEffect(() => {
    lastCommittedValueRef.current = selectedValue;
  }, [selectedValue]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * WHEEL_ITEM_HEIGHT,
        animated: false,
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [selectedIndex]);

  function snapToIndex(index: number, animated: boolean) {
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    const targetValue = items[clampedIndex]?.value;

    if (targetValue !== undefined && targetValue !== lastCommittedValueRef.current) {
      lastCommittedValueRef.current = targetValue;
      onChange(targetValue);
      void Haptics.selectionAsync();
    }

    scrollRef.current?.scrollTo({
      y: clampedIndex * WHEEL_ITEM_HEIGHT,
      animated,
    });
  }

  return (
    <View style={[styles.wheelFrame, style]}>
      <ScrollView
        bounces={false}
        decelerationRate="fast"
        onMomentumScrollEnd={(event) => {
          snapToIndex(
            Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT),
            true,
          );
        }}
        onScrollEndDrag={(event) => {
          snapToIndex(
            Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT),
            true,
          );
        }}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        snapToOffsets={items.map((_, index) => index * WHEEL_ITEM_HEIGHT)}
        contentContainerStyle={styles.wheelContent}>
        {items.map((item) => {
          const selected = item.value === selectedValue;

          return (
            <View key={`${item.label}-${item.value}`} style={styles.wheelRow}>
              <AppText
                variant={selected ? 'heroNumber' : 'title'}
                color={selected ? AppColors.text : AppColors.textMuted}
                style={selected ? styles.wheelTextSelected : styles.wheelText}>
                {item.label}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
      <View pointerEvents="none" style={styles.wheelSelectionBand} />
    </View>
  );
}

function ReviewSectionCard({
  children,
  label,
  style,
}: {
  children: ReactNode;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.summarySectionCard, style]}>
      <AppText variant="label" dimmed>
        {label}
      </AppText>
      {children}
    </View>
  );
}

function ReviewMacroRow({
  color,
  icon,
  label,
  material = false,
  maxLength,
  onChangeText,
  unit,
  value,
}: {
  color: string;
  icon: string;
  label: string;
  material?: boolean;
  maxLength: number;
  onChangeText: (value: string) => void;
  unit: string;
  value: string;
}) {
  return (
    <View style={styles.reviewMetricRow}>
      <View style={styles.reviewMetricLead}>
        <View style={styles.reviewMetricIconWrap}>
          {material ? (
            <MaterialCommunityIcons name={icon as never} size={16} color={color} />
          ) : (
            <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={color} />
          )}
        </View>
        <AppText variant="bodyStrong">{label}</AppText>
      </View>
      <View style={styles.reviewMetricInputWrap}>
        <TextInput
          keyboardType="number-pad"
          maxLength={maxLength}
          onChangeText={onChangeText}
          selectTextOnFocus
          style={styles.reviewMetricInput}
          value={value}
        />
        <AppText variant="bodyStrong" color={AppColors.textMuted}>
          {unit}
        </AppText>
      </View>
    </View>
  );
}

function ChoiceCard({
  badge,
  description,
  iconName,
  onPress,
  selected,
  title,
}: {
  badge?: string;
  description?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  selected: boolean;
  title: string;
}) {
  return (
    <PressScale onPress={onPress}>
      <View style={[styles.choiceCard, selected ? styles.choiceCardSelected : null]}>
        <View style={styles.choiceCardHeader}>
          <View style={[styles.choiceIcon, selected ? styles.choiceIconSelected : null]}>
            <Ionicons
              name={iconName}
              size={18}
              color={selected ? AppColors.white : AppColors.primary}
            />
          </View>
          {badge ? (
            <View style={styles.badge}>
              <AppText variant="micro" color={AppColors.primary}>
                {badge}
              </AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.choiceCardCopy}>
          <AppText variant="title" color={AppColors.text}>
            {title}
          </AppText>
          {description ? (
            <AppText variant="body" color={AppColors.textMuted}>
              {description}
            </AppText>
          ) : null}
        </View>
      </View>
    </PressScale>
  );
}

function PackCard({
  iconName,
  onPress,
  recommended,
  selected,
  subtitle,
  templateCount,
  title,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  recommended: boolean;
  selected: boolean;
  subtitle: string;
  templateCount: number;
  title: string;
}) {
  return (
    <PressScale onPress={onPress}>
      <View style={[styles.packCard, selected ? styles.packCardSelected : null]}>
        <View style={styles.packMainRow}>
          <View style={styles.packLead}>
            <View style={[styles.packIcon, selected ? styles.choiceIconSelected : null]}>
              <Ionicons
                name={iconName}
                size={16}
                color={selected ? AppColors.white : AppColors.primary}
              />
            </View>
            <View style={styles.packCopy}>
              <AppText variant="bodyStrong" color={AppColors.text}>
                {title}
              </AppText>
              <AppText numberOfLines={1} variant="micro" color={AppColors.textMuted}>
                {subtitle}
              </AppText>
              <View style={styles.packMetaRow}>
                <View style={[styles.templateCountPill, selected ? styles.templateCountPillSelected : null]}>
                  <AppText variant="label" color={AppColors.primary}>
                    {`${templateCount} templates`}
                  </AppText>
                </View>
                {recommended ? (
                  <View style={styles.recommendedBadge}>
                    <AppText variant="micro" color={AppColors.primary}>
                      Recommended
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
          <View style={[styles.selectionBadge, selected ? styles.selectionBadgeSelected : null]}>
            <Ionicons
              name={selected ? 'checkmark' : 'add'}
              size={14}
              color={selected ? AppColors.white : AppColors.primary}
            />
          </View>
        </View>
      </View>
    </PressScale>
  );
}

export function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding, isOnboardingComplete, skipOnboarding, state } = useAppData();
  const [hasStarted, setHasStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const splashFloat = useSharedValue(0);
  const splashRotate = useSharedValue(0);
  const [draft, setDraft] = useState<OnboardingDraft>({
    activityLevel: null,
    age: null,
    caloriesTarget: '',
    carbsTarget: '',
    fatsTarget: '',
    heightInches: null,
    nutritionGoal: null,
    proteinTarget: '',
    selectedPackIds: [],
    sex: null,
    weightPounds: null,
    workoutsPerWeek: null,
  });

  const currentStep = STEPS[stepIndex];
  const progress = buildProgress(stepIndex);
  const resolvedAge = draft.age ?? 20;
  const resolvedHeightInches = draft.heightInches ?? 69;
  const resolvedWeightPounds = draft.weightPounds ?? 165;
  const recommendedPackId = useMemo(
    () => getRecommendedStarterPackId(draft.workoutsPerWeek),
    [draft.workoutsPerWeek],
  );
  const splashMotionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: splashFloat.value },
      { rotateZ: `${splashRotate.value}deg` },
    ],
  }));
  const suggestedSummaryTargets = useMemo(() => {
    if (
      draft.sex === null ||
      draft.age === null ||
      draft.heightInches === null ||
      draft.weightPounds === null ||
      draft.activityLevel === null ||
      draft.nutritionGoal === null
    ) {
      return state.goals;
    }

    return calculateGoalTargets({
      age: draft.age,
      activityLevel: draft.activityLevel,
      heightInches: draft.heightInches,
      nutritionGoal: draft.nutritionGoal,
      sex: draft.sex,
      weightPounds: draft.weightPounds,
    });
  }, [
    draft.activityLevel,
    draft.age,
    draft.heightInches,
    draft.nutritionGoal,
    draft.sex,
    draft.weightPounds,
    state.goals,
  ]);

  useEffect(() => {
    if (currentStep !== 'summary') {
      return;
    }

    setDraft((currentValue) => {
      if (
        currentValue.caloriesTarget ||
        currentValue.proteinTarget ||
        currentValue.carbsTarget ||
        currentValue.fatsTarget
      ) {
        return currentValue;
      }

      return {
        ...currentValue,
        caloriesTarget: String(suggestedSummaryTargets.calories),
        proteinTarget: String(suggestedSummaryTargets.protein),
        carbsTarget: String(suggestedSummaryTargets.carbs),
        fatsTarget: String(suggestedSummaryTargets.fats),
      };
    });
  }, [currentStep, suggestedSummaryTargets]);

  useEffect(() => {
    if (hasStarted) {
      splashFloat.value = withTiming(0, { duration: 180 });
      splashRotate.value = withTiming(0, { duration: 180 });
      return;
    }

    splashFloat.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    splashRotate.value = withRepeat(
      withSequence(
        withTiming(-0.35, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [hasStarted, splashFloat, splashRotate]);

  if (isOnboardingComplete) {
    return <Redirect href="/" />;
  }

  function advanceStep() {
    setStepIndex((currentValue) => Math.min(currentValue + 1, STEPS.length - 1));
  }

  function retreatStep() {
    setStepIndex((currentValue) => Math.max(currentValue - 1, 0));
  }

  function handleSkipAll() {
    skipOnboarding();
    router.replace('/');
  }

  function skipCurrentStep() {
    setDraft((currentValue) => {
      if (currentStep === 'sex') {
        return {
          ...currentValue,
          sex: null,
        };
      }

      if (currentStep === 'age') {
        return {
          ...currentValue,
          age: null,
        };
      }

      if (currentStep === 'height') {
        return {
          ...currentValue,
          heightInches: null,
        };
      }

      if (currentStep === 'weight') {
        return {
          ...currentValue,
          weightPounds: null,
        };
      }

      if (currentStep === 'activity') {
        return {
          ...currentValue,
          activityLevel: null,
        };
      }

      if (currentStep === 'goal') {
        return {
          ...currentValue,
          nutritionGoal: null,
        };
      }

      if (currentStep === 'frequency') {
        return {
          ...currentValue,
          workoutsPerWeek: null,
        };
      }

      if (currentStep === 'packs') {
        return {
          ...currentValue,
          selectedPackIds: [],
        };
      }

      return currentValue;
    });
    advanceStep();
  }

  function handleFinish() {
    const caloriesValue = Number.parseInt(draft.caloriesTarget.trim(), 10);
    const proteinValue = Number.parseInt(draft.proteinTarget.trim(), 10);
    const carbsValue = Number.parseInt(draft.carbsTarget.trim(), 10);
    const fatsValue = Number.parseInt(draft.fatsTarget.trim(), 10);

    completeOnboarding({
      activityLevel: draft.activityLevel,
      age: draft.age,
      calories: Number.isFinite(caloriesValue) ? caloriesValue : suggestedSummaryTargets.calories,
      carbs: Number.isFinite(carbsValue) ? carbsValue : suggestedSummaryTargets.carbs,
      fats: Number.isFinite(fatsValue) ? fatsValue : suggestedSummaryTargets.fats,
      heightInches: draft.heightInches,
      nutritionGoal: draft.nutritionGoal,
      protein: Number.isFinite(proteinValue) ? proteinValue : suggestedSummaryTargets.protein,
      sex: draft.sex,
      starterPackIds: draft.selectedPackIds,
      weightPounds: draft.weightPounds,
      workoutsPerWeek: draft.workoutsPerWeek,
    });
    router.replace(draft.selectedPackIds.length > 0 ? '/gym' : '/');
  }

  function togglePack(packId: StarterTemplatePackId) {
    setDraft((currentValue) => ({
      ...currentValue,
      selectedPackIds: currentValue.selectedPackIds.includes(packId)
        ? currentValue.selectedPackIds.filter((value) => value !== packId)
        : [...currentValue.selectedPackIds, packId],
    }));
  }

  function renderWelcomeStep() {
    return (
      <View style={[styles.stepBody, styles.welcomeStepBody]}>
        <View style={[styles.heroPanel, styles.heroPanelWelcome]}>
          <View style={[styles.heroArtworkWrap, styles.heroArtworkWrapWelcome]}>
            <Animated.View style={[styles.heroArtworkMotion, splashMotionStyle]}>
              <Image
                contentFit="contain"
                contentPosition="center"
                source={ONBOARDING_SPLASH_IMAGE}
                style={[styles.heroArtwork, styles.heroArtworkWelcome]}
              />
            </Animated.View>
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="headline" style={styles.heroTitle}>
              Track Food & Lifts
            </AppText>
          </View>
        </View>
      </View>
    );
  }

  function renderSexStep() {
    return (
      <View style={styles.stepBody}>
        {SEX_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            description={option.description}
            iconName={option.iconName}
            onPress={() => {
              setDraft((currentValue) => ({
                ...currentValue,
                sex: option.value,
              }));
            }}
            selected={draft.sex === option.value}
            title={option.title}
          />
        ))}
      </View>
    );
  }

  function renderAgeStep() {
    const ageItems = Array.from({ length: 58 }, (_, index) => {
      const value = index + 13;

      return {
        label: String(value),
        value,
      };
    });

    return (
      <View style={[styles.stepBody, styles.wheelStepBody]}>
        <WheelPicker
          items={ageItems}
          onChange={(value) =>
            setDraft((currentValue) => ({
              ...currentValue,
              age: value,
            }))
          }
          selectedValue={resolvedAge}
          style={styles.singleWheel}
        />
      </View>
    );
  }

  function renderHeightStep() {
    const { feet, inches } = toFeetAndInches(resolvedHeightInches);
    const feetItems = [4, 5, 6, 7].map((value) => ({
      label: `${value} ft`,
      value,
    }));
    const inchItems = Array.from({ length: 12 }, (_, index) => ({
      label: `${index} in`,
      value: index,
    }));

    return (
      <View style={[styles.stepBody, styles.wheelStepBody]}>
        <View style={styles.wheelColumns}>
          <View style={styles.wheelColumn}>
            <AppText variant="micro" dimmed style={styles.wheelLabel}>
              Feet
            </AppText>
            <WheelPicker
              items={feetItems}
              onChange={(value) =>
                setDraft((currentValue) => {
                  const currentHeight = currentValue.heightInches ?? 69;
                  const { inches: currentInches } = toFeetAndInches(currentHeight);

                  return {
                    ...currentValue,
                    heightInches: Math.max(48, value * 12 + currentInches),
                  };
                })
              }
              selectedValue={feet}
            />
          </View>
          <View style={styles.wheelColumn}>
            <AppText variant="micro" dimmed style={styles.wheelLabel}>
              Inches
            </AppText>
            <WheelPicker
              items={inchItems}
              onChange={(value) =>
                setDraft((currentValue) => {
                  const currentHeight = currentValue.heightInches ?? 69;
                  const { feet: currentFeet } = toFeetAndInches(currentHeight);

                  return {
                    ...currentValue,
                    heightInches: Math.max(48, currentFeet * 12 + value),
                  };
                })
              }
              selectedValue={inches}
            />
          </View>
        </View>
      </View>
    );
  }

  function renderWeightStep() {
    const weightItems = Array.from({ length: 281 }, (_, index) => {
      const value = index + 80;

      return {
        label: `${value} lb`,
        value,
      };
    });

    return (
      <View style={[styles.stepBody, styles.wheelStepBody]}>
        <WheelPicker
          items={weightItems}
          onChange={(value) =>
            setDraft((currentValue) => ({
              ...currentValue,
              weightPounds: value,
            }))
          }
          selectedValue={resolvedWeightPounds}
          style={styles.singleWheel}
        />
      </View>
    );
  }

  function renderActivityStep() {
    return (
      <View style={styles.stepBody}>
        {ACTIVITY_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            description={option.description}
            iconName={option.iconName}
            onPress={() =>
              setDraft((currentValue) => ({
                ...currentValue,
                activityLevel: option.value,
              }))
            }
            selected={draft.activityLevel === option.value}
            title={option.title}
          />
        ))}
      </View>
    );
  }

  function renderGoalStep() {
    return (
      <View style={styles.stepBody}>
        {GOAL_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            description={option.description}
            iconName={option.iconName}
            onPress={() =>
              setDraft((currentValue) => ({
                ...currentValue,
                nutritionGoal: option.value,
              }))
            }
            selected={draft.nutritionGoal === option.value}
            title={option.title}
          />
        ))}
      </View>
    );
  }

  function renderFrequencyStep() {
    return (
      <View style={styles.stepBody}>
        {FREQUENCY_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.title}
            description={option.description}
            iconName={option.iconName}
            onPress={() =>
              setDraft((currentValue) => ({
                ...currentValue,
                workoutsPerWeek: option.value,
              }))
            }
            selected={draft.workoutsPerWeek === option.value}
            title={option.title}
          />
        ))}
      </View>
    );
  }

  function renderPackStep() {
    return (
      <View style={[styles.stepBody, styles.packStepBody]}>
        {STARTER_TEMPLATE_PACKS.map((pack) => (
          <View key={pack.id} style={styles.packRowWrap}>
            <PackCard
              iconName={pack.iconName as keyof typeof Ionicons.glyphMap}
            onPress={() => togglePack(pack.id)}
            recommended={recommendedPackId === pack.id}
            selected={draft.selectedPackIds.includes(pack.id)}
            subtitle={pack.subtitle}
            templateCount={pack.templateCount}
            title={pack.title}
          />
          </View>
        ))}
      </View>
    );
  }

  function renderSummaryStep() {
    const selectedPacks = STARTER_TEMPLATE_PACKS.filter((pack) =>
      draft.selectedPackIds.includes(pack.id),
    );

    return (
      <View style={styles.stepBody}>
        <View style={styles.summaryPanel}>
          <ReviewSectionCard label="Diet">
            <View style={styles.reviewMetricList}>
              <ReviewMacroRow
                color="#1D1F24"
                icon="flame-outline"
                label="Calories"
                maxLength={4}
                onChangeText={(value) =>
                  setDraft((currentValue) => ({
                    ...currentValue,
                    caloriesTarget: value.replace(/[^0-9]/g, ''),
                  }))
                }
                unit="kcal"
                value={draft.caloriesTarget}
              />
              <ReviewMacroRow
                color="#E76F6A"
                icon="food-drumstick"
                label="Protein"
                material
                maxLength={3}
                onChangeText={(value) =>
                  setDraft((currentValue) => ({
                    ...currentValue,
                    proteinTarget: value.replace(/[^0-9]/g, ''),
                  }))
                }
                unit="g"
                value={draft.proteinTarget}
              />
              <ReviewMacroRow
                color="#E2A061"
                icon="bread-slice"
                label="Carbs"
                material
                maxLength={3}
                onChangeText={(value) =>
                  setDraft((currentValue) => ({
                    ...currentValue,
                    carbsTarget: value.replace(/[^0-9]/g, ''),
                  }))
                }
                unit="g"
                value={draft.carbsTarget}
              />
              <ReviewMacroRow
                color="#5B8EE6"
                icon="peanut"
                label="Fats"
                material
                maxLength={3}
                onChangeText={(value) =>
                  setDraft((currentValue) => ({
                    ...currentValue,
                    fatsTarget: value.replace(/[^0-9]/g, ''),
                  }))
                }
                unit="g"
                value={draft.fatsTarget}
              />
            </View>
          </ReviewSectionCard>
          <ReviewSectionCard label="Gym">
            <View style={styles.summaryRow}>
              <View style={styles.summaryLead}>
                <Ionicons name="barbell-outline" size={16} color={AppColors.primary} />
                <AppText variant="body" dimmed>
                  Weekly target
                </AppText>
              </View>
              <AppText variant="bodyStrong">
                {draft.workoutsPerWeek ? `${draft.workoutsPerWeek} / week` : 'Set later'}
              </AppText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <View style={styles.summaryLead}>
                <Ionicons name="albums-outline" size={16} color={AppColors.primary} />
                <AppText variant="body" dimmed>
                  Starter packs
                </AppText>
              </View>
              <AppText variant="bodyStrong" style={styles.summaryValueText}>
                {selectedPacks.length > 0
                  ? selectedPacks.map((pack) => pack.title).join(', ')
                  : 'None selected'}
              </AppText>
            </View>
          </ReviewSectionCard>
        </View>
      </View>
    );
  }

  function renderStepContent() {
    if (!hasStarted) {
      return renderWelcomeStep();
    }

    if (currentStep === 'sex') {
      return renderSexStep();
    }

    if (currentStep === 'age') {
      return renderAgeStep();
    }

    if (currentStep === 'height') {
      return renderHeightStep();
    }

    if (currentStep === 'weight') {
      return renderWeightStep();
    }

    if (currentStep === 'activity') {
      return renderActivityStep();
    }

    if (currentStep === 'goal') {
      return renderGoalStep();
    }

    if (currentStep === 'frequency') {
      return renderFrequencyStep();
    }

    if (currentStep === 'packs') {
      return renderPackStep();
    }

    return renderSummaryStep();
  }

  const canGoBack = stepIndex > 0;
  const primaryLabel =
    !hasStarted
      ? 'Get started'
      : currentStep === 'summary'
        ? 'Enter app'
        : 'Continue';

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.container}>
        <View style={styles.header}>
          {hasStarted ? (
            <View style={styles.headerTopLine}>
              {canGoBack ? (
                <PressScale haptic="none" onPress={retreatStep} pressEffect="opacity">
                  <View style={styles.backButton}>
                    <Ionicons name="arrow-back" size={18} color={AppColors.text} />
                  </View>
                </PressScale>
              ) : (
                <View style={styles.backButtonPlaceholder} />
              )}
              <PressScale haptic="none" onPress={handleSkipAll} pressEffect="opacity">
                <View style={styles.skipAllButton}>
                  <AppText variant="label" color={AppColors.textMuted}>
                    Skip all
                  </AppText>
                </View>
              </PressScale>
            </View>
          ) : null}
            {!hasStarted ? (
              <View style={[styles.headerBrandRow, styles.headerBrandRowWelcome]}>
                <View style={styles.headerBrandLogoBox}>
                  <Image
                    contentFit="cover"
                    source={ONBOARDING_LOGO_IMAGE}
                    style={styles.headerBrandLogo}
                  />
                </View>
                <AppText variant="headline">BruinGains</AppText>
              </View>
            ) : null}
            {hasStarted ? (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            ) : null}
            {hasStarted ? (
              <View style={styles.headerCopy}>
                <AppText variant="headline">
                  {currentStep === 'sex'
                    ? 'Sex'
                    : currentStep === 'age'
                      ? 'Age'
                      : currentStep === 'height'
                        ? 'Height'
                        : currentStep === 'weight'
                          ? 'Weight'
                        : currentStep === 'activity'
                          ? 'Activity level'
                          : currentStep === 'goal'
                            ? 'Primary goal'
                            : currentStep === 'frequency'
                              ? 'Workouts per week'
                              : currentStep === 'packs'
                                ? 'Starter templates'
                                : 'Targets'}
                </AppText>
                <AppText variant="body" color={AppColors.textMuted}>
                  {getStepSubtitle(currentStep)}
                </AppText>
              </View>
            ) : null}
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              !hasStarted ? styles.scrollContentWelcome : null,
            ]}
            showsVerticalScrollIndicator={false}>
            {renderStepContent()}
          </ScrollView>

          <View style={styles.footer}>
            <ActionButton
              label={primaryLabel}
              onPress={
                !hasStarted
                  ? () => setHasStarted(true)
                  : currentStep === 'summary'
                    ? handleFinish
                    : advanceStep
              }
              style={styles.footerButton}
            />
            {hasStarted && currentStep !== 'summary' ? (
              <PressScale haptic="none" onPress={skipCurrentStep} pressEffect="opacity">
                <View style={styles.skipStepButton}>
                  <AppText variant="bodyStrong" color={AppColors.textMuted}>
                    Skip this step
                  </AppText>
                </View>
              </PressScale>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  header: {
    gap: Spacing.md,
  },
  headerTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLowest,
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  skipAllButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBrandRowWelcome: {
    alignSelf: 'center',
  },
  headerBrandLogoBox: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    backgroundColor: AppColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  headerBrandLogo: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  progressTrack: {
    height: 4,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceHighest,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: AppColors.primary,
  },
  headerCopy: {
    gap: Spacing.xs,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: Spacing.sm,
  },
  scrollContentWelcome: {
    flexGrow: 1,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  stepBody: {
    gap: Spacing.sm,
  },
  packStepBody: {
    flex: 1,
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  packRowWrap: {
    flex: 1,
  },
  welcomeStepBody: {
    flex: 1,
  },
  heroPanel: {
    borderRadius: Radii.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: AppColors.surfaceLowest,
    ...Shadows.soft,
  },
  heroPanelWelcome: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 440,
    paddingBottom: Spacing.md,
  },
  heroArtworkWrap: {
    borderRadius: Radii.xl,
    backgroundColor: AppColors.surfaceVariant,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArtworkWrapWelcome: {
    minHeight: 428,
  },
  heroArtwork: {
    width: '100%',
    height: 360,
  },
  heroArtworkWelcome: {
    width: '100%',
    height: 428,
  },
  heroArtworkMotion: {
    width: '100%',
    alignItems: 'center',
  },
  heroCopy: {
    gap: 2,
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  heroTitle: {
    textAlign: 'center',
    fontSize: 25,
    lineHeight: 29,
    fontFamily: Fonts.displayBold,
  },
  choiceCard: {
    borderRadius: Radii.xl,
    backgroundColor: AppColors.surfaceLowest,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  choiceCardSelected: {
    backgroundColor: 'rgba(39, 116, 174, 0.10)',
  },
  choiceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choiceIcon: {
    width: 34,
    height: 34,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(39, 116, 174, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIconSelected: {
    backgroundColor: AppColors.primary,
  },
  packIcon: {
    width: 28,
    height: 28,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(39, 116, 174, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(39, 116, 174, 0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  choiceCardCopy: {
    gap: Spacing.xs,
  },
  wheelStepBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  wheelColumns: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  wheelColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  wheelLabel: {
    textTransform: 'uppercase',
  },
  singleWheel: {
    width: '100%',
  },
  wheelFrame: {
    width: '100%',
    height: WHEEL_FRAME_HEIGHT,
    borderRadius: Radii.xl,
    backgroundColor: AppColors.surfaceLowest,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  wheelContent: {
    paddingVertical: WHEEL_VERTICAL_PADDING,
  },
  wheelRow: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    opacity: 0.55,
  },
  wheelTextSelected: {
    opacity: 1,
  },
  wheelSelectionBand: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    top: WHEEL_VERTICAL_PADDING,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(39, 116, 174, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(39, 116, 174, 0.12)',
  },
  packCard: {
    borderRadius: Radii.xl,
    backgroundColor: AppColors.surfaceLowest,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    height: '100%',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  packCardSelected: {
    backgroundColor: 'rgba(39, 116, 174, 0.10)',
  },
  packMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  packLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recommendedBadge: {
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(254, 204, 0, 0.22)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  selectionBadge: {
    width: 22,
    height: 22,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(39, 116, 174, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionBadgeSelected: {
    width: 22,
    height: 22,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packCopy: {
    gap: 2,
    flex: 1,
    justifyContent: 'center',
  },
  packMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  templateCountPill: {
    alignSelf: 'flex-start',
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(39, 116, 174, 0.08)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  templateCountPillSelected: {
    backgroundColor: 'rgba(39, 116, 174, 0.12)',
  },
  summaryPanel: {
    gap: Spacing.sm,
  },
  summarySectionCard: {
    borderRadius: Radii.xl,
    backgroundColor: AppColors.surfaceLowest,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.soft,
  },
  summaryTopLine: {
    gap: Spacing.xs,
  },
  reviewMetricList: {
    gap: Spacing.sm,
  },
  reviewMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  reviewMetricLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  reviewMetricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewMetricInputWrap: {
    minWidth: 112,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    borderRadius: Radii.md,
    backgroundColor: AppColors.surfaceVariant,
    borderWidth: 1,
    borderColor: AppColors.outlineVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  reviewMetricInput: {
    minWidth: 56,
    color: AppColors.text,
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'right',
    paddingVertical: 0,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: AppColors.outlineVariant,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  summaryLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  summaryValueText: {
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  footerButton: {
    width: '100%',
  },
  skipStepButton: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
