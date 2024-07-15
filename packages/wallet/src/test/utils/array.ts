/**
 * Generates an array of a specified length, where each element is created using a provided factory function.
 * The type of the returned array reflects the exact number of elements specified, providing stronger type safety
 * than a standard array type.
 *
 * @param factory - A no-argument function that returns an element of type T to populate the array.
 * @param length - The desired length of the resulting array, specified as a number.
 * @returns An array of type `ArrayOfLength<L, T>`, where `L` is the specified length and `T` is the type of elements returned by the factory function.
 *
 * @example
 * ```typescript
 * // Number factory function
 * const numFactory = () => Math.floor(Math.random() * 100);
 * // Create an array of 4 numbers
 * const nums = createArray(numFactory, 4);
 * console.log(nums); // [23, 45, 67, 89] (example output)
 *
 * // String factory function
 * const stringFactory = () => "hello";
 * // Create an array of 2 strings
 * const strings = createArray(stringFactory, 2);
 * console.log(strings); // ["hello", "hello"]
 * ```
 */
export const createArray = <T, L extends number>(
  length: L,
  factory: (index: number) => T
): ArrayOfLength<L, T> => {
  const result = []
  for (let i = 0; i < length; i++) {
    result.push(factory(i))
  }
  return result as ArrayOfLength<L, T>
}
