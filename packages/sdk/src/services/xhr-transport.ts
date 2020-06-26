import { Status } from '@arena-im/chat-types';
import { BaseTransport, XHRHeaders } from '../interfaces/base-transport';
import { SyncPromise } from '../utils/syncpromise';
import { getRequestURL } from '../utils/misc';

/** Base transport class implementation */
export class XHRTransport implements BaseTransport {
  private headers: XHRHeaders = {};

  public constructor(private baseURL: string, authToken?: string) {
    if (authToken) {
      this.headers.Authorization = `Bearer ${authToken}`;
    }
  }

  /**
   * @inheritdoc
   */
  public post<T, K>(path: string, payload: K): PromiseLike<T> {
    return this.makeRequestResponse<T, K>(path, 'POST', payload);
  }

  /**
   * @inheritdoc
   */
  public get<T>(path: string): PromiseLike<T> {
    return this.makeRequestResponse<T, void>(path, 'GET');
  }

  /**
   * @inheritdoc
   */
  public delete(path: string): PromiseLike<void> {
    const url = getRequestURL(this.baseURL, path);

    return new SyncPromise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.onreadystatechange = () => {
        if (request.readyState !== 4) {
          return;
        }

        const status = Status.fromHttpCode(request.status);

        if (status === Status.Success) {
          resolve();
          return;
        }

        reject(status);
      };

      request.open('DELETE', url);

      for (const header in this.headers) {
        // eslint-disable-next-line no-prototype-builtins
        if (this.headers.hasOwnProperty(header)) {
          request.setRequestHeader(header, this.headers[header]);
        }
      }

      request.send();
    });
  }

  /**
   * Makes a request and return a response
   *
   * @param url request URL
   * @param options request options
   */
  private makeRequestResponse<T, K>(path: string, method: string, payload?: K): PromiseLike<T> {
    const url = getRequestURL(this.baseURL, path);

    return new SyncPromise<T>((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.onreadystatechange = () => {
        if (request.readyState !== 4) {
          return;
        }

        const status = Status.fromHttpCode(request.status);

        if (status === Status.Success) {
          resolve(request.response);
          return;
        }

        reject(status);
      };

      request.open(method, url);

      for (const header in this.headers) {
        // eslint-disable-next-line no-prototype-builtins
        if (this.headers.hasOwnProperty(header)) {
          request.setRequestHeader(header, this.headers[header]);
        }
      }

      request.send(payload ? JSON.stringify(payload) : null);
    });
  }
}
