/** Unicode subscript digits for 0-9 */
const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'] as const

/**
 * Convert a number to its subscript representation.
 * @param num - The number to convert (should be a positive integer)
 * @returns The number with each digit converted to its subscript Unicode character
 */
export function toSubscript(num: number): string {
  return String(num)
    .split('')
    .map((digit) => SUBSCRIPT_DIGITS[parseInt(digit, 10)] ?? digit)
    .join('')
}
