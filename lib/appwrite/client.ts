import 'react-native-url-polyfill/auto';

import {
  Account,
  Client,
  ExecutionMethod,
  Functions,
} from 'react-native-appwrite';

type ClientWithPing = Client & {
  ping: () => Promise<unknown>;
};

const appwriteClient = new Client()
  .setProject('6a067d46002856bc7794')
  .setEndpoint('https://sfo.cloud.appwrite.io/v1')
  .setPlatform('com.skill4ace.bruingains');

export const client: ClientWithPing = Object.assign(appwriteClient, {
  ping: () =>
    appwriteClient.call(
      'get',
      new URL(`${appwriteClient.config.endpoint}/health/version`)
    ),
});

export const account = new Account(client);
export const functions = new Functions(client);

let ensureSessionPromise: Promise<void> | null = null;

function isMissingSessionError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: number; type?: string };
  return candidate.code === 401 || candidate.type === 'user_unauthorized';
}

export async function ensureAnonymousAppwriteSession() {
  if (ensureSessionPromise) {
    return ensureSessionPromise;
  }

  ensureSessionPromise = (async () => {
    try {
      await account.get();
      return;
    } catch (error) {
      if (!isMissingSessionError(error)) {
        throw error;
      }
    }

    await account.createAnonymousSession();
  })().finally(() => {
    ensureSessionPromise = null;
  });

  return ensureSessionPromise;
}

export type AppwriteFunctionResult<T> =
  | { data: T; notModified: false; version: string | null; generatedAt: string | null }
  | { data: null; notModified: true; version: string | null; generatedAt: string | null };

export async function invokeCampusDataFunction<T>(
  body: Record<string, unknown>,
): Promise<AppwriteFunctionResult<T>> {
  await ensureAnonymousAppwriteSession();

  const execution = await functions.createExecution({
    functionId: 'campus-data',
    body: JSON.stringify(body),
    async: false,
    xpath: '/',
    method: ExecutionMethod.POST,
    headers: {
      'content-type': 'application/json',
    },
  });
  const version =
    execution.responseHeaders.find(
      (header) => header.name.toLowerCase() === 'x-bruingains-cache-version',
    )?.value ?? null;
  const generatedAt =
    execution.responseHeaders.find(
      (header) => header.name.toLowerCase() === 'x-bruingains-cache-generated-at',
    )?.value ?? null;

  if (execution.responseStatusCode === 304) {
    return { data: null, generatedAt, notModified: true, version };
  }

  if (execution.responseStatusCode < 200 || execution.responseStatusCode >= 300) {
    throw new Error(
      execution.responseBody || `Campus data request failed (${execution.responseStatusCode})`,
    );
  }

  return {
    data: JSON.parse(execution.responseBody) as T,
    generatedAt,
    notModified: false,
    version,
  };
}
