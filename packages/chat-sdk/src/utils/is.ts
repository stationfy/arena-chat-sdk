/**
 * Checks whether given value's type is a string.
 * {@link isString}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isString(wat: any): boolean {
  return Object.prototype.toString.call(wat) === '[object String]';
}

/**
 * Checks whether given value's is a primitive (undefined, null, number, boolean, string).
 * {@link isPrimitive}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isPlainObject(wat: any): boolean {
  return Object.prototype.toString.call(wat) === '[object Object]';
}

/**
 * Checks whether given value has a then function.
 * @param wat A value to be checked.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isThenable(wat: any): boolean {
  return Boolean(wat && wat.then && typeof wat.then === 'function');
}

export function isEqualReactions(reactionA: { [key: string]: number }, reactionB: { [key: string]: number }): boolean {
  const reactionAKeys = Object.keys(reactionA);
  const reactionBKeys = Object.keys(reactionB);

  if (reactionAKeys.length !== reactionBKeys.length) {
    return false;
  }

  for (const key of reactionAKeys) {
    if (reactionA[key] !== reactionB[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Checks whether given value type is a Poll[].
 * @param wat A value to be checked.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isPolls(wat: any): boolean {
  if (!Array.isArray(wat)) {
    return false;
  }

  for (const poll of wat) {
    if (
      !(
        poll &&
        poll._id &&
        poll.chatRoomId &&
        poll.createdAt &&
        poll.options &&
        poll.publishedAt &&
        poll.question &&
        poll.siteId &&
        typeof poll.total !== 'undefined'
      )
    ) {
      return false;
    }
  }

  return true;
}
