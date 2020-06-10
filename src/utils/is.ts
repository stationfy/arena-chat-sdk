/**
 * Checks whether given value's type is a string
 * {@link isString}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
export function isString(wat: any): boolean {
  return Object.prototype.toString.call(wat) === '[object String]';
}

/**
 * Checks whether given value's is a primitive (undefined, null, number, boolean, string)
 * {@link isPrimitive}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
export function isPrimitive(wat: any): boolean {
  return wat === null || (typeof wat !== 'object' && typeof wat !== 'function');
}

/**
 * Checks whether given value's type is an object literal
 * {@link isPlainObject}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
export function isPlainObject(wat: any): boolean {
  return Object.prototype.toString.call(wat) === '[object Object]';
}

/**
 * Checks whether given value has a then function.
 * @param wat A value to be checked.
 */
export function isThenable(wat: any): boolean {
  return Boolean(wat && wat.then && typeof wat.then === 'function');
}
