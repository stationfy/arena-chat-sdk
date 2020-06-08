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
    // tslint:disable-next-line:no-unused-expression
    new Headers();
    // tslint:disable-next-line:no-unused-expression
    new Request('');
    // tslint:disable-next-line:no-unused-expression
    new Response();
    return true;
  } catch (e) {
    return false;
  }
}
