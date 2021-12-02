import { getGlobalObject } from './misc';

/**
 * Tells whether current enviroment supports Fecth API
 * {@link supportsFetch}
 *
 * @returns Answer to the given question.
 */
export function supportsFetch(): boolean {
  if (!('fetch' in getGlobalObject<Window>())) {
    return false;
  }

  try {
    new Headers();
    new Request('');
    new Response();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Tells whether current enviroment supports LocalStorage API
 * {@link supportsLocalStorage}
 *
 * @returns Answer to the given question.
 */
export function supportsLocalStorage(): boolean {
  return 'localStorage' in getGlobalObject<Window>();
}

/**
 * Tells whether current enviroment supports Cookies
 * {@link supportsCookies}
 *
 * @returns Answer to the given question.
 */
export function supportsCookies(): boolean {
  return !!getGlobalObject<Window>()?.navigator?.cookieEnabled;
}
