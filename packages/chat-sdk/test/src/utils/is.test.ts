import { isThenable, isPlainObject, isPrimitive, isString } from '@utils/is';
import { SyncPromise } from '@utils/syncpromise';

describe('isThenable()', () => {
  test('should work as advertised', () => {
    expect(isThenable(Promise.resolve(true))).toEqual(true);
    expect(isThenable(SyncPromise.resolve(true))).toEqual(true);

    expect(isThenable(undefined)).toEqual(false);
    expect(isThenable(null)).toEqual(false);
    expect(isThenable(true)).toEqual(false);
    expect(isThenable('foo')).toEqual(false);
    expect(isThenable(42)).toEqual(false);
    expect(isThenable({})).toEqual(false);
    expect(isThenable([])).toEqual(false);
    expect(isThenable(new Error('foo'))).toEqual(false);
    expect(isThenable(new Date())).toEqual(false);
  });
});

describe('isPrimitive()', () => {
  test('should work as advertised', () => {
    expect(isPrimitive(undefined)).toEqual(true);
    expect(isPrimitive(null)).toEqual(true);
    expect(isPrimitive(true)).toEqual(true);
    expect(isPrimitive('foo')).toEqual(true);
    expect(isPrimitive(42)).toEqual(true);

    expect(isPrimitive({})).toEqual(false);
    expect(isPrimitive([])).toEqual(false);
    expect(isPrimitive(new Error('foo'))).toEqual(false);
    expect(isPrimitive(new Date())).toEqual(false);
  });
});

describe('isPlainObject()', () => {
  test('should work as advertised', () => {
    expect(isPlainObject('wat')).toEqual(false);
    expect(isPlainObject(2)).toEqual(false);
    expect(isPlainObject({})).toEqual(true);
  });
});

describe('isString()', () => {
  test('should work as advertised', () => {
    expect(isString(new Error('wat'))).toEqual(false);
    expect(isString('wat')).toEqual(true);
  });
});

describe('isPrimitive()', () => {
  test('should work as advertised', () => {
    expect(isPrimitive('wat')).toEqual(true);
    expect(isPrimitive(2)).toEqual(true);
    expect(isPrimitive({})).toEqual(false);
  });
});
