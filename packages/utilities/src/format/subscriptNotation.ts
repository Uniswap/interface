import { parseForSubscriptNotation } from 'utilities/src/format/parseForSubscriptNotation'
import { toSubscript } from 'utilities/src/format/toSubscript'

function getDecimalSeparator(locale: string): string {
  const part = new Intl.NumberFormat(locale).formatToParts(1.1).find((p) => p.type === 'decimal')
  return part?.value ?? '.'
}

/**
 * Format a number as a locale-aware string, using Unicode subscript notation
 * (e.g. "0.0₄52") when the value has more leading decimal zeros than the
 * `subscriptThreshold`. Returns a plain string suitable for canvas-rendered
 * chart axes or anywhere a JSX subscript component isn't possible.
 */
export function formatNumberWithSubscript({
  value,
  locale,
  minSigDigits = 2,
  maxSigDigits = 4,
  subscriptThreshold = 4,
}: {
  value: number
  locale: string
  minSigDigits?: number
  maxSigDigits?: number
  subscriptThreshold?: number
}): string {
  const parsed = parseForSubscriptNotation({
    value,
    locale,
    minSigDigits,
    maxSigDigits,
    subscriptThreshold,
  })

  if (!parsed.useSubscript) {
    return parsed.fullFormatted
  }

  const sep = getDecimalSeparator(locale)
  return `0${sep}0${toSubscript(parsed.leadingZeros)}${parsed.significantPart}`
}
