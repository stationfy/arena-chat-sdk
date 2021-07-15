import { supportsLocalStorage } from 'src/utils/supports';
import { getGlobalObject } from '../utils/misc';

export class LocalStorageAPI {
  private global = getGlobalObject<Window>();
  private cache = {} as Record<string, string>;

  constructor() { }

  public setItem(key: string, value: string) {
    if (supportsLocalStorage()) {
      this.global.localStorage.setItem(key, value);
    } else {
      this.cache[key] = value;
    }
  }

  public getItem(key: string) {
    if (supportsLocalStorage()) {
      return this.global.localStorage.getItem(key);
    }

    return this.cache[key];
  }
}
