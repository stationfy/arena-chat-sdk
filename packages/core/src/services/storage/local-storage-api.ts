import { BaseStorageAPI } from '../../interfaces';
import { getGlobalObject } from '../../utils/misc';

export class LocalStorageAPI implements BaseStorageAPI {
  private global = getGlobalObject<Window>();

  public setItem(key: string, value: string): void {
    this.global.localStorage.setItem(key, value);
  }

  public getItem(key: string): string | null {
    return this.global.localStorage.getItem(key);
  }

  public removeItem(key: string): void {
    this.global.localStorage.removeItem(key);
  }
}
