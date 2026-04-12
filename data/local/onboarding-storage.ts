import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_STATE_KEY = '@bruingains/onboarding-state';
const ONBOARDING_STATE_VERSION = 1;

export type PersistedOnboardingState = {
  completed: boolean;
};

type PersistedOnboardingEnvelope = {
  version: number;
  state: PersistedOnboardingState;
};

const DEFAULT_ONBOARDING_STATE: PersistedOnboardingState = {
  completed: false,
};

export async function loadOnboardingState(): Promise<PersistedOnboardingState> {
  let rawValue: string | null = null;

  try {
    rawValue = await AsyncStorage.getItem(ONBOARDING_STATE_KEY);
  } catch {
    return DEFAULT_ONBOARDING_STATE;
  }

  if (!rawValue) {
    return DEFAULT_ONBOARDING_STATE;
  }

  try {
    const parsed = JSON.parse(rawValue) as PersistedOnboardingEnvelope;

    if (parsed.version !== ONBOARDING_STATE_VERSION) {
      return DEFAULT_ONBOARDING_STATE;
    }

    return {
      completed: Boolean(parsed.state?.completed),
    };
  } catch {
    return DEFAULT_ONBOARDING_STATE;
  }
}

export async function saveOnboardingState(state: PersistedOnboardingState) {
  const payload: PersistedOnboardingEnvelope = {
    version: ONBOARDING_STATE_VERSION,
    state,
  };

  try {
    await AsyncStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(payload));
  } catch {
    // Keep first-run navigation usable even if persistence is temporarily unavailable.
  }
}

export async function clearOnboardingState() {
  try {
    await AsyncStorage.removeItem(ONBOARDING_STATE_KEY);
  } catch {
    // Keep first-run navigation usable even if persistence is temporarily unavailable.
  }
}
