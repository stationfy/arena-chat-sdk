import { Status } from '@arena-im/chat-types';
import { BaseTransport } from '../interfaces/base-transport';
import { SyncPromise } from '../utils/syncpromise';
import { getGlobalObject, getRequestURL } from '../utils/misc';

/** Base transport class implementation */
export class FetchTransport implements BaseTransport {
  private headers = new Headers();

  private global = getGlobalObject<Window>();

  public constructor(private baseURL: string, authToken?: string) {
    if (authToken) {
      this.headers.append('Authorization', `Bearer ${authToken}`);
    }
  }

  /**
   * @inheritDoc
   */
  public post<T, K>(path: string, payload: K): PromiseLike<T> {
    const options: RequestInit = {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: this.headers,
    };

    const url = getRequestURL(this.baseURL, path);

    return this.makeRequestResponse<T>(url, options);
  }

  /**
   * @inheritDoc
   */
  public get<T>(path: string): PromiseLike<T> {
    const options: RequestInit = {
      method: 'GET',
      headers: this.headers,
    };

    const url = getRequestURL(this.baseURL, path);

    return this.makeRequestResponse<T>(url, options);
  }

  public delete(path: string): PromiseLike<void> {
    const options: RequestInit = {
      method: 'DELETE',
      headers: this.headers,
    };

    const url = getRequestURL(this.baseURL, path);

    return new SyncPromise<void>((resolve, reject) => {
      this.global
        .fetch(url, options)
        .then((response) => {
          const status = Status.fromHttpCode(response.status);

          if (status === Status.Success) {
            resolve();
            return;
          }

          reject(status);
        })
        .catch(reject);
    });
  }

  /**
   * Makes a request and return a response
   *
   * @param url request URL
   * @param options request options
   */
  private makeRequestResponse<T>(url: string, options: RequestInit): PromiseLike<T> {
    return new SyncPromise<T>((resolve, reject) => {
      this.global
        .fetch(url, options)
        .then((response) => {
          const status = Status.fromHttpCode(response.status);

          if (status === Status.Success) {
            resolve(response.json());
            return;
          }

          reject(status);
        })
        .catch(reject);
    });
  }
}
