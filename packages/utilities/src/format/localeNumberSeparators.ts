/** Decimal and group separators for a locale, from `Intl.NumberFormat.formatToParts`. */
export function getLocaleNumberSeparators(locale?: string): { decimal: string; group: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5)
  return {
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
  }
}

/** Strip locale group separators and normalize the decimal separator to `.`. */
export function normalizeIntlNumberToDotDecimal(formatted: string, locale?: string): string {
  const { decimal, group } = getLocaleNumberSeparators(locale)
  let normalized = group ? formatted.split(group).join('') : formatted
  if (decimal !== '.') {
    normalized = normalized.replace(decimal, '.')
  }
  return normalized
}

/** Format a canonical dot-decimal digit string with locale thousand + decimal separators. */
export function formatDotDecimalForLocale(dotDecimal: string, locale?: string): string {
  if (!dotDecimal) {
    return ''
  }
  if (!/^\d*\.?\d*$/.test(dotDecimal)) {
    return dotDecimal
  }
  const { decimal, group } = getLocaleNumberSeparators(locale)
  const dotIdx = dotDecimal.indexOf('.')
  const intPart = dotIdx === -1 ? dotDecimal : dotDecimal.slice(0, dotIdx)
  const fracPart = dotIdx === -1 ? '' : dotDecimal.slice(dotIdx + 1)
  const groupedInt = insertGroupSeparators(intPart, group)
  return fracPart.length > 0 ? `${groupedInt}${decimal}${fracPart}` : groupedInt
}

function insertGroupSeparators(intPart: string, group: string): string {
  if (intPart.length <= 3 || !group) {
    return intPart
  }
  let out = ''
  for (let i = 0; i < intPart.length; i++) {
    const remaining = intPart.length - i
    if (i > 0 && remaining > 0 && remaining % 3 === 0) {
      out += group
    }
    out += intPart[i]
  }
  return out
}
