import { getGlobalObject, getRequestURL } from '../../../src/utils/misc';

describe('getGlobalObject()', () => {
  test('should return the same object', () => {
    const backup = global.process;
    delete global.process;
    const first = getGlobalObject();
    const second = getGlobalObject();
    expect(first).toEqual(second);
    global.process = backup;
  });
});

describe('getRequestURL()', () => {
  const baseURL = 'https://api-dev.arena.im/v2';
  test('should return the correct url with resource that does not start with /', () => {
    const result = getRequestURL(baseURL, 'resource/1');

    expect(result).toEqual(`${baseURL}/resource/1`);
  });

  test('should return the correct url with resource that starts with /', () => {
    const result = getRequestURL(baseURL, '/resource/1');

    expect(result).toEqual(`${baseURL}/resource/1`);
  });
});
