import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import {
  fallbackDiningHalls,
  fallbackGymCapacities,
} from '@/data/public/campus-fallbacks';
import { hasSupabasePublicEnv, supabasePublicClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import type {
  GymCapacitySnapshot,
  PublicDiningHall,
  PublicResourceState,
} from '@/types/app-data';

const DINING_CACHE_KEY = '@bruingains/public-dining-halls';
const GYM_CAPACITY_CACHE_KEY = '@bruingains/public-gym-capacities';
const PUBLIC_CACHE_MAX_AGE_MS = 15 * 60 * 1000;

type CacheEnvelope<T> = {
  data: T;
  updatedAt: string;
};

type DiningHallRow = Database['public']['Tables']['dining_halls']['Row'];
type GymLocationRow = Database['public']['Tables']['gym_locations']['Row'];
type GymCapacitySnapshotRow = Database['public']['Tables']['gym_capacity_snapshots']['Row'] & {
  gym_locations: GymLocationRow | null;
};

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
    name: row.gym_locations.name,
    hours: row.gym_locations.hours,
    load: row.load,
    percent: row.percent_full ?? Math.round(row.load * 100),
    capturedAt: row.captured_at,
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
      'id,location_id,load,percent_full,captured_at,gym_locations!inner(id,name,hours,sort_order)',
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

export function formatPublicDataStatus(updatedAt: string | null, source: string, isStale: boolean) {
  if (source === 'network' && updatedAt) {
    return `Live • ${new Date(updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  if (source === 'cache' && updatedAt) {
    return isStale ? 'Cached • stale' : 'Cached on device';
  }

  return 'Local fallback';
}
