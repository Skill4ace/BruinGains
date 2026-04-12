import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import {
  fallbackDiningHalls,
  fallbackGymCapacities,
} from '@/data/public/campus-fallbacks';
import {
  ensureAnonymousSupabaseSession,
  hasSupabasePublicEnv,
  supabasePublicClient,
} from '@/lib/supabase/client';
import type {
  DiningCustomizationOption,
  DiningMenuItem,
  DiningNutritionFact,
  GymCapacityZone,
  GymCapacitySnapshot,
  PublicDiningHall,
  PublicResourceState,
} from '@/types/app-data';

const DINING_CACHE_KEY = '@bruingains/public-dining-halls-v6';
const DINING_MENU_ITEMS_CACHE_KEY = '@bruingains/public-dining-menu-items-v4';
const GYM_CAPACITY_CACHE_KEY = '@bruingains/public-gym-capacities-v3';
const PUBLIC_CACHE_MAX_AGE_MS = 15 * 60 * 1000;
const EMPTY_DINING_MENU_ITEMS: DiningMenuItem[] = [];

type CacheEnvelope<T> = {
  data: T;
  updatedAt: string;
};

type CampusDataBundle = {
  diningHalls: PublicDiningHall[];
  diningMenuItems: DiningMenuItem[];
  gymCapacities: GymCapacitySnapshot[];
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

function parseGymCapacityZones(value: unknown): GymCapacityZone[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const candidate = entry as Record<string, unknown>;

    if (typeof candidate.name !== 'string') {
      return [];
    }

    return [
      {
        name: candidate.name,
        count: typeof candidate.count === 'number' ? candidate.count : 0,
        capacity: typeof candidate.capacity === 'number' ? candidate.capacity : 0,
        percent: typeof candidate.percent === 'number' ? candidate.percent : 0,
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

let campusDataInFlight: Promise<CampusDataBundle | null> | null = null;

function normalizeCampusDataBundle(value: unknown): CampusDataBundle | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  return {
    diningHalls: Array.isArray(candidate.diningHalls)
      ? (candidate.diningHalls as PublicDiningHall[])
      : [],
    diningMenuItems: Array.isArray(candidate.diningMenuItems)
      ? (candidate.diningMenuItems as DiningMenuItem[])
      : [],
    gymCapacities: Array.isArray(candidate.gymCapacities)
      ? (candidate.gymCapacities as GymCapacitySnapshot[])
      : [],
  };
}

async function fetchCampusDataBundleFromFunction() {
  if (!hasSupabasePublicEnv || !supabasePublicClient) {
    return null;
  }

  if (campusDataInFlight) {
    return campusDataInFlight;
  }

  campusDataInFlight = (async () => {
    await ensureAnonymousSupabaseSession();
    const { data, error } = await supabasePublicClient.functions.invoke('campus-data');

    if (error) {
      throw error;
    }

    return normalizeCampusDataBundle(data);
  })().finally(() => {
    campusDataInFlight = null;
  });

  return campusDataInFlight;
}

async function fetchDiningHallsFromSupabase() {
  const bundle = await fetchCampusDataBundleFromFunction();
  return bundle && bundle.diningHalls.length > 0 ? bundle.diningHalls : null;
}

async function fetchGymCapacitiesFromSupabase() {
  const bundle = await fetchCampusDataBundleFromFunction();
  return bundle && bundle.gymCapacities.length > 0 ? bundle.gymCapacities : null;
}

async function fetchLatestDiningMenuItemsFromSupabase() {
  const bundle = await fetchCampusDataBundleFromFunction();
  return bundle && bundle.diningMenuItems.length > 0 ? bundle.diningMenuItems : null;
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      setState((currentState) => {
        if (!currentState.updatedAt) {
          return currentState;
        }

        const nextIsStale = isStale(currentState.updatedAt);

        if (nextIsStale === currentState.isStale) {
          return currentState;
        }

        return {
          ...currentState,
          isStale: nextIsStale,
        };
      });
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

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
