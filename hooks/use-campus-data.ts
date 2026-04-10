import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import {
  fallbackDiningHalls,
  fallbackGymCapacities,
} from '@/data/public/campus-fallbacks';
import { hasSupabasePublicEnv, supabasePublicClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import type {
  DiningCustomizationOption,
  DiningMenuItem,
  DiningNutritionFact,
  GymCapacitySnapshot,
  PublicDiningHall,
  PublicResourceState,
} from '@/types/app-data';

const DINING_CACHE_KEY = '@bruingains/public-dining-halls-v6';
const DINING_MENU_ITEMS_CACHE_KEY = '@bruingains/public-dining-menu-items-v4';
const GYM_CAPACITY_CACHE_KEY = '@bruingains/public-gym-capacities-v2';
const PUBLIC_CACHE_MAX_AGE_MS = 15 * 60 * 1000;
const EMPTY_DINING_MENU_ITEMS: DiningMenuItem[] = [];
const DINING_MENU_PAGE_SIZE = 500;

type CacheEnvelope<T> = {
  data: T;
  updatedAt: string;
};

type DiningHallRow = Database['public']['Tables']['dining_halls']['Row'];
type GymLocationRow = Database['public']['Tables']['gym_locations']['Row'];
type GymCapacitySnapshotRow = Database['public']['Tables']['gym_capacity_snapshots']['Row'] & {
  gym_locations: GymLocationRow | null;
};
type LatestDiningMenuItemRow = {
  allergen_labels: unknown;
  badge_labels: unknown;
  hall_id: string;
  hall_name: string;
  hall_sort_order: number;
  service_date: string;
  meal_period: DiningMenuItem['mealPeriod'];
  snapshot_status: string;
  fetched_at: string;
  recipe_id: number | null;
  station_name: string | null;
  item_name: string;
  serving_size: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  customization_options: unknown;
  ingredients: unknown;
  item_order: number;
  nutrition_facts: unknown;
};

function parseJsonStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function parseNutritionFacts(value: unknown): DiningNutritionFact[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const candidate = entry as Record<string, unknown>;

    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.label !== 'string' ||
      typeof candidate.value !== 'string'
    ) {
      return [];
    }

    return [
      {
        id: candidate.id,
        label: candidate.label,
        value: candidate.value,
        dailyValuePercent:
          typeof candidate.dailyValuePercent === 'number'
            ? candidate.dailyValuePercent
            : null,
      },
    ];
  });
}

function parseCustomizationOptions(value: unknown): DiningCustomizationOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const candidate = entry as Record<string, unknown>;

    if (typeof candidate.itemName !== 'string') {
      return [];
    }

    return [
      {
        recipeId: typeof candidate.recipeId === 'number' ? candidate.recipeId : null,
        itemName: candidate.itemName,
        defaultQuantity:
          typeof candidate.defaultQuantity === 'number' && candidate.defaultQuantity > 0
            ? Math.round(candidate.defaultQuantity)
            : 1,
        servingSize:
          typeof candidate.servingSize === 'string' ? candidate.servingSize : null,
        calories: typeof candidate.calories === 'number' ? candidate.calories : null,
        proteinG: typeof candidate.proteinG === 'number' ? candidate.proteinG : null,
        carbsG: typeof candidate.carbsG === 'number' ? candidate.carbsG : null,
        fatsG: typeof candidate.fatsG === 'number' ? candidate.fatsG : null,
        badgeLabels: parseJsonStringArray(candidate.badgeLabels),
        allergenLabels: parseJsonStringArray(candidate.allergenLabels),
        ingredients: parseJsonStringArray(candidate.ingredients),
        nutritionFacts: parseNutritionFacts(candidate.nutritionFacts),
      },
    ];
  });
}

function isStale(updatedAt: string) {
  return Date.now() - new Date(updatedAt).getTime() > PUBLIC_CACHE_MAX_AGE_MS;
}

async function loadCachedResource<T>(key: string) {
  const rawValue = await AsyncStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as CacheEnvelope<T>;
  } catch {
    return null;
  }
}

async function saveCachedResource<T>(key: string, data: T) {
  const payload: CacheEnvelope<T> = {
    data,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(key, JSON.stringify(payload));
}

function createInitialState<T>(fallbackData: T): PublicResourceState<T> {
  return {
    data: fallbackData,
    error: null,
    isLoading: true,
    isRefreshing: false,
    isStale: false,
    source: 'fallback',
    updatedAt: null,
  };
}

function mapDiningHallRow(row: DiningHallRow): PublicDiningHall {
  return {
    id: row.id,
    name: row.name,
    fitPercent: row.fit_percent,
    hours: {
      breakfast: row.breakfast_hours,
      lunch: row.lunch_hours,
      dinner: row.dinner_hours,
      lateNight: row.late_night_hours,
    },
  };
}

function mapGymCapacityRow(row: GymCapacitySnapshotRow): GymCapacitySnapshot | null {
  if (!row.gym_locations) {
    return null;
  }

  return {
    id: row.location_id,
    isClosed: row.is_closed,
    name: row.gym_locations.name,
    hours: row.gym_locations.hours,
    load: row.load,
    percent: row.percent_full ?? Math.round(row.load * 100),
    zoneName: row.zone_name,
    capturedAt: row.captured_at,
  };
}

function mapLatestDiningMenuItemRow(row: LatestDiningMenuItemRow): DiningMenuItem {
  return {
    allergenLabels: parseJsonStringArray(row.allergen_labels),
    badgeLabels: parseJsonStringArray(row.badge_labels),
    hallId: row.hall_id,
    hallName: row.hall_name,
    hallSortOrder: row.hall_sort_order,
    serviceDate: row.service_date,
    mealPeriod: row.meal_period,
    snapshotStatus: row.snapshot_status,
    fetchedAt: row.fetched_at,
    recipeId: row.recipe_id,
    stationName: row.station_name ?? 'Station',
    itemName: row.item_name,
    servingSize: row.serving_size,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatsG: row.fats_g,
    ingredients: parseJsonStringArray(row.ingredients),
    itemOrder: row.item_order,
    nutritionFacts: parseNutritionFacts(row.nutrition_facts),
    customizationOptions: parseCustomizationOptions(row.customization_options),
  };
}

async function fetchDiningHallsFromSupabase() {
  if (!hasSupabasePublicEnv || !supabasePublicClient) {
    return null;
  }

  const { data, error } = await supabasePublicClient
    .from('dining_halls')
    .select(
      'id,name,fit_percent,breakfast_hours,lunch_hours,dinner_hours,late_night_hours,sort_order',
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    throw error ?? new Error('Unable to load dining halls');
  }

  const mapped = (data as DiningHallRow[]).map(mapDiningHallRow);
  return mapped.length > 0 ? mapped : null;
}

async function fetchGymCapacitiesFromSupabase() {
  if (!hasSupabasePublicEnv || !supabasePublicClient) {
    return null;
  }

  const { data, error } = await supabasePublicClient
    .from('gym_capacity_snapshots')
    .select(
      'id,location_id,load,percent_full,captured_at,is_closed,zone_name,gym_locations!inner(id,name,hours,sort_order)',
    )
    .order('captured_at', { ascending: false })
    .limit(10);

  if (error || !data) {
    throw error ?? new Error('Unable to load gym capacities');
  }

  const deduped = new Map<string, GymCapacitySnapshot>();

  (data as GymCapacitySnapshotRow[]).forEach((row) => {
    const mapped = mapGymCapacityRow(row);

    if (mapped && !deduped.has(mapped.id)) {
      deduped.set(mapped.id, mapped);
    }
  });

  const snapshots = [...deduped.values()];
  return snapshots.length > 0 ? snapshots : null;
}

async function fetchLatestDiningMenuItemsFromSupabase() {
  if (!hasSupabasePublicEnv || !supabasePublicClient) {
    return null;
  }

  const rows: LatestDiningMenuItemRow[] = [];
  let pageStart = 0;

  while (true) {
    const pageEnd = pageStart + DINING_MENU_PAGE_SIZE - 1;
    const { data, error } = await supabasePublicClient
      .from('latest_menu_items')
      .select(
        'allergen_labels,badge_labels,hall_id,hall_name,hall_sort_order,service_date,meal_period,snapshot_status,fetched_at,recipe_id,station_name,item_name,serving_size,calories,protein_g,carbs_g,fats_g,customization_options,ingredients,item_order,nutrition_facts',
      )
      .order('hall_sort_order', { ascending: true })
      .order('meal_period', { ascending: true })
      .order('item_order', { ascending: true })
      .range(pageStart, pageEnd);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...(data as LatestDiningMenuItemRow[]));

    if (data.length < DINING_MENU_PAGE_SIZE) {
      break;
    }

    pageStart += DINING_MENU_PAGE_SIZE;
  }

  const items = rows.map(mapLatestDiningMenuItemRow);
  return items.length > 0 ? items : null;
}

function useCachedCampusResource<T>(
  cacheKey: string,
  fallbackData: T,
  loader: () => Promise<T | null>,
) {
  const [state, setState] = useState<PublicResourceState<T>>(
    createInitialState(fallbackData),
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const cached = await loadCachedResource<T>(cacheKey);

      if (!isMounted) {
        return;
      }

      if (cached) {
        setState({
          data: cached.data,
          error: null,
          isLoading: false,
          isRefreshing: hasSupabasePublicEnv,
          isStale: isStale(cached.updatedAt),
          source: 'cache',
          updatedAt: cached.updatedAt,
        });
      } else {
        setState((currentState) => ({
          ...currentState,
          isLoading: !hasSupabasePublicEnv,
          isRefreshing: hasSupabasePublicEnv,
        }));
      }

      if (!hasSupabasePublicEnv) {
        if (!cached) {
          setState({
            data: fallbackData,
            error: null,
            isLoading: false,
            isRefreshing: false,
            isStale: false,
            source: 'fallback',
            updatedAt: null,
          });
        }
        return;
      }

      try {
        const networkData = await loader();

        if (!isMounted) {
          return;
        }

        if (networkData) {
          const nextUpdatedAt = new Date().toISOString();

          setState({
            data: networkData,
            error: null,
            isLoading: false,
            isRefreshing: false,
            isStale: false,
            source: 'network',
            updatedAt: nextUpdatedAt,
          });
          await saveCachedResource(cacheKey, networkData);
          return;
        }

        if (!cached) {
          setState({
            data: fallbackData,
            error: null,
            isLoading: false,
            isRefreshing: false,
            isStale: false,
            source: 'fallback',
            updatedAt: null,
          });
        } else {
          setState((currentState) => ({
            ...currentState,
            isRefreshing: false,
          }));
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          data: cached?.data ?? fallbackData,
          error:
            error instanceof Error
              ? error.message
              : 'Unable to refresh campus data',
          isLoading: false,
          isRefreshing: false,
          isStale: cached ? isStale(cached.updatedAt) : true,
          source: cached ? 'cache' : 'fallback',
          updatedAt: cached?.updatedAt ?? null,
        }));
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [cacheKey, fallbackData, loader]);

  return state;
}

export function useDiningHalls() {
  return useCachedCampusResource(
    DINING_CACHE_KEY,
    fallbackDiningHalls,
    fetchDiningHallsFromSupabase,
  );
}

export function useGymCapacities() {
  return useCachedCampusResource(
    GYM_CAPACITY_CACHE_KEY,
    fallbackGymCapacities,
    fetchGymCapacitiesFromSupabase,
  );
}

export function useDiningMenuItems() {
  return useCachedCampusResource(
    DINING_MENU_ITEMS_CACHE_KEY,
    EMPTY_DINING_MENU_ITEMS,
    fetchLatestDiningMenuItemsFromSupabase,
  );
}

export function formatPublicDataStatus(updatedAt: string | null, source: string, isStale: boolean) {
  if (source === 'network' && updatedAt) {
    return `Live • ${new Date(updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  if (source === 'cache' && updatedAt) {
    return isStale ? 'Cached • stale' : 'Cached on device';
  }

  return 'Local fallback';
}
