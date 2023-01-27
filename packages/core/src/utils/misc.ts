const fallbackGlobalObject = {};

/**
 * Safely get global scope object
 *
 * @returns Global scope object
 */
export function getGlobalObject<T>(): T {
  return (
    isNodeEnv()
      ? global
      : typeof window !== 'undefined'
      ? window
      : typeof self !== 'undefined'
      ? self
      : fallbackGlobalObject
  ) as T;
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

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * `wait` milliseconds.
 */
type Procedure = (...args: any[]) => void;

export type Options = {
  isImmediate: boolean;
};

export function debounce<F extends Procedure>(
  func: F,
  waitMilliseconds = 50,
  options: Options = {
    isImmediate: false,
  },
): (this: ThisParameterType<F>, ...args: Parameters<F>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    const doLater = () => {
      timeoutId = undefined;
      if (!options.isImmediate) {
        func.apply(this, args);
      }
    };

    const shouldCallNow = options.isImmediate && timeoutId === undefined;

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(doLater, waitMilliseconds);

    if (shouldCallNow) {
      func.apply(this, args);
    }
  };
}

/**
 * Whether the SDK is running on mobile device
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function promiseTimeout(promise: Promise<any>, time: number): Promise<any> {
  return Promise.race([
    promise,
    new Promise((_resolve, reject) =>
      setTimeout(() => {
        reject(new Error('Timeout'));
      }, time),
    ),
  ]);
}

export function generateUUIDV4(): string {
  try {
    return uuidv4()
  } catch (e) {
    console.info("The browser doesn't support web cryptography")
  }

  let dt = new Date().getTime()
  const mask = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
  const uuid = mask.replace(/[xy]/g, function (c) {
    const r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
  return uuid
}

function uuidv4 () {
  // @ts-ignore
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
    return (c ^ (global.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  })
}