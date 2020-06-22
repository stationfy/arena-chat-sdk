import { getGlobalObject } from '@utils/misc';

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
