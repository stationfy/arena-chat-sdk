import { supportsLocalStorage } from '../utils/supports';
import { getGlobalObject } from '../utils/misc';

export class LocalStorageAPI {
  private global = getGlobalObject<Window>();
  private cache = {} as Record<string, string>;

  public setItem(key: string, value: string): void {
    if (supportsLocalStorage()) {
      this.global.localStorage.setItem(key, value);
    } else {
      this.cache[key] = value;
    }
  }

  public getItem(key: string): string | null {
    if (supportsLocalStorage()) {
      return this.global.localStorage.getItem(key);
    }

    return this.cache[key];
  }
}
