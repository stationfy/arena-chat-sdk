import { BaseStorageAPI } from '../../interfaces';

export class CacheAPI implements BaseStorageAPI {
  private cache = {} as Record<string, string>;

  public setItem(key: string, value: string): void {
    this.cache[key] = value;
  }

  public getItem(key: string): string | null {
    return this.cache[key] ?? null;
  }

  public removeItem(key: string): void {
    delete this.cache[key];
  }
}
