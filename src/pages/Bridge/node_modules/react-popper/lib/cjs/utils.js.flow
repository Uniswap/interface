// @flow strict
import * as React from 'react';
import { type Ref } from './RefTypes';

/**
 * Takes an argument and if it's an array, returns the first item in the array,
 * otherwise returns the argument. Used for Preact compatibility.
 */
export const unwrapArray = (arg: *): * => (Array.isArray(arg) ? arg[0] : arg);

/**
 * Takes a maybe-undefined function and arbitrary args and invokes the function
 * only if it is defined.
 */
export const safeInvoke = <F: Function>(
  fn: ?F,
  ...args: Array<mixed>
): $Call<F> => {
  if (typeof fn === 'function') {
    return fn(...args);
  }
};

/**
 * Sets a ref using either a ref callback or a ref object
 */
export const setRef = (ref: ?Ref, node: ?HTMLElement): void => {
  // if its a function call it
  if (typeof ref === 'function') {
    return safeInvoke(ref, node);
  }
  // otherwise we should treat it as a ref object
  else if (ref != null) {
    ref.current = node;
  }
};

/**
 * Simple ponyfill for Object.fromEntries
 */
export const fromEntries = (
  entries: Array<[string, any]>
): { [key: string]: any } =>
  entries.reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

/**
 * Small wrapper around `useLayoutEffect` to get rid of the warning on SSR envs
 */
export const useIsomorphicLayoutEffect:
  | typeof React.useEffect
  | typeof React.useLayoutEffect =
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
    ? React.useLayoutEffect
    : React.useEffect;
