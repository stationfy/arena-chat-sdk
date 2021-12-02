import { getGlobalObject } from '../../utils/misc';
import { BaseStorageAPI } from '../../interfaces';

export class CookiesAPI implements BaseStorageAPI {
  private global = getGlobalObject<Window>();

  public setItem(key: string, value: string): void {
    if (!(typeof value === 'string')) {
      value = JSON.stringify(value);
    }

    const date = new Date();
    date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
    const expires = '; expires=' + date.toUTCString();
    this.global.document.cookie = key + '=' + (value || '') + expires + '; path=/';
  }

  public getItem(key: string): string | null {
    const nameEQ = key + '=';
    const ca = this.global.document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        let value = c.substring(nameEQ.length, c.length);

        try {
          value = JSON.parse(value);

          return value;
        } catch (e) {
          return value;
        }
      }
    }
    return null;
  }

  public removeItem(key: string): void {
    this.global.document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
  }
}
