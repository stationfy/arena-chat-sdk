const fallbackGlobalObject = {};

/**
 * Safely get global scope object
 *
 * @returns Global scope object
 */
export function getGlobalObject<T>(): T {
  return (isNodeEnv()
    ? global
    : typeof window !== 'undefined'
    ? window
    : typeof self !== 'undefined'
    ? self
    : fallbackGlobalObject) as T;
}

/**
 * Checks whether we're in the Node.js or Browser enviroment
 *
 * @returns Answer to given question
 */
export function isNodeEnv(): boolean {
  return Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';
}

/**
 * Get the request URL
 *
 * @param baseURL Arena service base url
 * @param path service route
 */
export function getRequestURL(baseURL: string, path: string): string {
  return `${baseURL}${path.startsWith('/') ? '' : '/'}${path}`;
}
