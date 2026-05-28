/**
 * Returns a random value from the given enum.
 *
 * @param enumObj The enum object from which a random value is to be selected. This object should be a TypeScript enum
 * where the enum values are of type string.
 * @returns A random value from the specified enum.
 *
 * @example
 * ```typescript
 * enum Colors {
 *   Red = 'RED',
 *   Green = 'GREEN',
 *   Blue = 'BLUE'
 * }
 *
 * const randomColor = randomEnumValue(Colors);
 * console.log(randomColor); // Outputs: 'RED', 'GREEN', or 'BLUE' (randomly selected)
 * ```
 *
 * @typeparam T Type of the enum object (will be automatically inferred from the provided argument).
 */
export const randomEnumValue = <T extends Record<string, string | number>>(enumObj: T): T[keyof T] => {
  // If enum has different types for keys and values (keys are always strings,
  // values can be strings or numbers), we need to filter out the keys
  const keys = Object.keys(enumObj).filter((key) => isNaN(Number(key)))
  const randomKey = randomChoice(keys)
  return enumObj[randomKey] as T[keyof T]
}

/**
 * Returns a random value from the array of choices.
 *
 * @returns A random value from the specified array.
 */
export const randomChoice = <T>(choices: T[]): T => {
  return choices[Math.floor(Math.random() * choices.length)]!
}
