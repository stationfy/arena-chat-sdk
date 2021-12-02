import { supportsCookies, supportsLocalStorage } from '../utils/supports';
import { LocalStorageAPI } from './storage/local-storage-api';
import { BaseStorageAPI } from '../interfaces';
import { CacheAPI } from './storage/cache-api';
import { CookiesAPI } from './storage/cookies-api';

export class StorageAPI {
  private storage;

  public constructor() {
    this.storage = this.getStorage();
  }

  private getStorage(): BaseStorageAPI {
    if (supportsLocalStorage()) {
      return new LocalStorageAPI();
    }

    if (supportsCookies()) {
      return new CookiesAPI();
    }

    return new CacheAPI();
  }

  public setItem(key: string, value: string): void {
    this.storage.setItem(key, value);
  }

  public getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  public removeItem(key: string): void {
    this.storage.removeItem(key);
  }
}
