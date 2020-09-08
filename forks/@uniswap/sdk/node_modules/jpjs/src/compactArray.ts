/**
 * Returns a new Array containing all the element of the source array except
 * `null` and `undefined` ones. This brings the benefit of strong typing over
 * `Array.prototype.filter`.
 */
export function compactArray<T>(
  arr: Array<T | null | undefined | false | '' | 0>
): T[] {
  var result = [];
  for (var i = 0; i < arr.length; ++i) {
    var elem = arr[i];
    if (elem != null) {
      result.push(elem);
    }
  }
  return result as T[];
}
