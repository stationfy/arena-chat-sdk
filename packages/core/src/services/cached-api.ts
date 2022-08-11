import { RestAPI } from './rest-api';
import { LocalStorageAPI } from './storage/local-storage-api';

const CACHED_API_LOCAL_STORAGE_PREFIX = 'arena-cached-api-';

interface PayloadCached<T> {
  timestamp: string;
  value: T;
}

const localStorage = new LocalStorageAPI();

export async function fetchCachedAPIData<T>(path: string): Promise<T | null> {
  let payload = getClientCache<T>(path);

  if (payload) {
    return payload;
  }

  try {
    const restAPI = RestAPI.getCachedInstance();

    payload = await restAPI.fetchCachedAPI<T>(path);

    if (!payload) {
      payload = getClientCache<T>(path, true);
    }
  } catch (e) {
    payload = getClientCache<T>(path, true);
  }

  setClientCache(path, payload);

  return payload;
}

function getClientCache<T>(path: string, expired = false): T | null {
  try {
    const cachedPayload = localStorage.getItem(`${CACHED_API_LOCAL_STORAGE_PREFIX}${path}`);

    if (cachedPayload === null) {
      return null;
    }

    const cachedPayloadParsed = JSON.parse(cachedPayload) as PayloadCached<T>;
    const expireTime = cachedPayloadParsed.timestamp;
    const now = new Date().getTime().toString();

    if (!expired && diffTime(expireTime, now) >= 10) {
      return null;
    }

    return cachedPayloadParsed.value;
  } catch (_error) {
    return null;
  }
}

function setClientCache<T>(path: string, value: T): void {
  try {
    const payloadCached = { timestamp: new Date().getTime().toString(), value } as PayloadCached<T>;
    localStorage.setItem(`${CACHED_API_LOCAL_STORAGE_PREFIX}${path}`, JSON.stringify(payloadCached));
  } catch (e) {
    console.error('Cannot set cached-api cache.');
  }
}

function diffTime(time1: string, time2: string) {
  const date1 = +new Date(parseInt(time1));
  const date2 = +new Date(parseInt(time2));

  const diffMiliseconds = date2 - date1;

  return Math.floor(diffMiliseconds / 1000 / 60);
}
