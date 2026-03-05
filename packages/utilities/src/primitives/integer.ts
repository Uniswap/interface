/**
 * Checks if given number exceeds the maximum safe integer.
 * Unlike Number.isSafeInteger, which fails if the given value is not a number, this function allows to check both types.
 *
 * @param number The number to check. The number must be raw and not converted to correctly make an assertion.
 * @returns True if the number is safe, false otherwise.
 */
export function isSafeNumber(number: number | string): boolean {
  if (typeof number === 'number') {
    return number <= Number.MAX_SAFE_INTEGER
  }

  if (typeof number === 'string') {
    if (!isNumeric(number, true)) {
      return false
    }

    const parsed = Number(number.trim())
    return !Number.isFinite(parsed) ? false : parsed <= Number.MAX_SAFE_INTEGER
  }

  return false
}

export function isNumeric(number: string, allowEmptyValue: boolean = false): boolean {
  const trimmedValue = number.trim()
  if (allowEmptyValue && trimmedValue === '') {
    return true
  }

  return !Number.isNaN(trimmedValue) && !Number.isNaN(Number.parseFloat(trimmedValue))
}
