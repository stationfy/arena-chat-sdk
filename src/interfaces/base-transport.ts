/** Base transport used to consume rest api */
export interface BaseTransport {
  /**
   * POST method
   *
   * @param path service route
   * @param payload post data
   */
  post<T, K>(path: string, payload: K): PromiseLike<T>;

  /**
   * GET method
   *
   * @param path service route
   */
  get<T>(path: string): PromiseLike<T>;

  /**
   * DELETE method
   *
   * @param path service route
   */
  delete(path: string): PromiseLike<void>;
}

export interface XHRHeaders {
  [key: string]: string;
}
