/**
 * Get the unique values of an array. Quickly.
 */
export function uniq<T>(arr: T[]) {
  const seen = new Set();
  return arr.filter((x: T) => {
    if (seen.has(x)) {
      return;
    }
    seen.add(x);
    return true;
  });
}
