import AsyncStorage from '@react-native-async-storage/async-storage';

import { createDefaultLocalAppData, mergeLocalAppData } from '@/data/local/default-state';
import type { LocalAppData } from '@/types/app-data';

const LOCAL_APP_STATE_KEY = '@bruingains/local-app-state';
const LOCAL_APP_STATE_VERSION = 1;

type PersistedLocalAppEnvelope = {
  version: number;
  state: Partial<LocalAppData>;
};

export async function loadLocalAppData() {
  let rawValue: string | null = null;

  try {
    rawValue = await AsyncStorage.getItem(LOCAL_APP_STATE_KEY);
  } catch {
    return createDefaultLocalAppData();
  }

  if (!rawValue) {
    return createDefaultLocalAppData();
  }

  try {
    const parsed = JSON.parse(rawValue) as PersistedLocalAppEnvelope;

    if (parsed.version !== LOCAL_APP_STATE_VERSION) {
      return createDefaultLocalAppData();
    }

    return mergeLocalAppData(parsed.state);
  } catch {
    return createDefaultLocalAppData();
  }
}

export async function saveLocalAppData(state: LocalAppData) {
  const payload: PersistedLocalAppEnvelope = {
    version: LOCAL_APP_STATE_VERSION,
    state,
  };

  try {
    await AsyncStorage.setItem(LOCAL_APP_STATE_KEY, JSON.stringify(payload));
  } catch {
    // Keep the app usable even if native persistence is temporarily unavailable.
  }
}

export async function clearLocalAppData() {
  try {
    await AsyncStorage.removeItem(LOCAL_APP_STATE_KEY);
  } catch {
    // Keep the app usable even if native persistence is temporarily unavailable.
  }
}
