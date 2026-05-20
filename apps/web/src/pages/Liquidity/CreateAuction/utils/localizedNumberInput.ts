import { useCallback, useLayoutEffect, useMemo, useRef, type ComponentRef } from 'react'
import { Input } from 'ui/src'

type InputRef = ComponentRef<typeof Input>

/** Locale's decimal + thousand separators, derived from Intl.NumberFormat. */
export function getLocaleSeparators(locale: string): { decimal: string; group: string } {
  const parts = Intl.NumberFormat(locale).formatToParts(1234.5)
  return {
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
  }
}

/**
 * Formats a canonical "1234.56" (dot-decimal, no separators) string with locale thousand+decimal
 * separators. Preserves trailing decimal point and leading zeros so live formatting doesn't
 * disrupt in-progress typing. Returns the input unchanged if it contains a compact suffix
 * (k/m/b/t) or non-numeric characters — callers can mix this with shorthand input.
 *
 * Pass `maxDecimals` to cap the fractional digits for display purposes (truncation, trailing zeros
 * trimmed). Don't pass this while the user is typing or it will eat in-progress digits — use it
 * only in unfocused / read-only renderings.
 */
export function formatLocalizedNumber({
  rawValue,
  locale,
  maxDecimals,
}: {
  rawValue: string
  locale: string
  maxDecimals?: number
}): string {
  if (!rawValue) {
    return ''
  }
  if (/[kmbt]$/i.test(rawValue)) {
    return rawValue
  }
  if (!/^\d*\.?\d*$/.test(rawValue)) {
    return rawValue
  }
  const { decimal, group } = getLocaleSeparators(locale)
  const dotIdx = rawValue.indexOf('.')
  const intPart = dotIdx === -1 ? rawValue : rawValue.slice(0, dotIdx)
  let fracPart = dotIdx === -1 ? '' : rawValue.slice(dotIdx + 1)
  if (maxDecimals !== undefined && fracPart.length > maxDecimals) {
    fracPart = fracPart.slice(0, maxDecimals).replace(/0+$/, '')
  }
  const groupedInt = insertGroupSeparators(intPart, group)
  const preserveDot = dotIdx !== -1 && (maxDecimals === undefined || fracPart.length > 0)
  return preserveDot ? `${groupedInt}${decimal}${fracPart}` : groupedInt
}

/** Insert `group` every 3 digits from the right in a plain digit string. Loop-based to avoid
 * regex-engine backtracking concerns flagged by the lint security rule. */
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

/**
 * Strips locale group separators and normalizes decimal separator to '.'.
 * Returns null if the input contains illegal characters after stripping (and no compact suffix).
 * Inputs ending in a compact suffix (k/m/b/t): strip group separators and normalize the locale
 * decimal to '.' so downstream compact parsers (dot-decimal regex) accept locale-formatted typing.
 */
export function parseLocalizedNumber(input: string, locale: string): string | null {
  if (/[kmbt]$/i.test(input)) {
    const { group, decimal } = getLocaleSeparators(locale)
    let normalized = group ? input.split(group).join('') : input
    if (decimal !== '.') {
      normalized = normalized.replace(decimal, '.')
    }
    return normalized
  }
  const { decimal, group } = getLocaleSeparators(locale)
  let normalized = input
  if (group) {
    normalized = normalized.split(group).join('')
  }
  if (decimal !== '.') {
    normalized = normalized.replace(decimal, '.')
  }
  if (!/^\d*\.?\d*$/.test(normalized)) {
    return null
  }
  return normalized
}

/** Count characters in `s` that are not the group separator. */
function countSignificant(s: string, group: string): number {
  if (!group) {
    return s.length
  }
  let n = 0
  for (const ch of s) {
    if (ch !== group) {
      n++
    }
  }
  return n
}

/** Find the index in `formatted` after which `n` non-group-separator chars precede. */
function indexAfterSignificant({
  formatted,
  count,
  group,
}: {
  formatted: string
  count: number
  group: string
}): number {
  if (count <= 0) {
    return 0
  }
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] !== group) {
      seen++
      if (seen === count) {
        return i + 1
      }
    }
  }
  return formatted.length
}

/**
 * Controlled-input hook for numeric fields that:
 *   - displays the value with locale thousand + decimal separators (live, even while typing),
 *   - normalizes typed input back to a dot-decimal canonical string before invoking `onChangeRaw`,
 *   - preserves cursor position across re-formatting by tracking digit-significant character count.
 *
 * The parent owns the canonical raw string. Validation/clamping happens inside `onChangeRaw`;
 * if it rejects an update (no state change), the displayed value stays the same and the cursor
 * settles at the position with the equivalent digit count — typically end-of-input, which is
 * acceptable for rejected keystrokes.
 *
 * Attach `inputRef` to the `<Input>` and pass `handleChange` to `onChangeText`. Read `displayValue`
 * for the input's `value` prop and for unfocused `<Text>` rendering so both states stay consistent.
 */
export function useLocalizedNumberInput({
  rawValue,
  locale,
  onChangeRaw,
}: {
  rawValue: string
  locale: string
  onChangeRaw: (next: string) => void
}): {
  displayValue: string
  inputRef: React.RefObject<InputRef | null>
  handleChange: (typed: string) => void
} {
  const inputRef = useRef<InputRef | null>(null)
  const pendingCursorRef = useRef<number | null>(null)

  const { group } = useMemo(() => getLocaleSeparators(locale), [locale])
  const displayValue = useMemo(() => formatLocalizedNumber({ rawValue, locale }), [rawValue, locale])

  const handleChange = useCallback(
    (typed: string) => {
      const el = inputRef.current as unknown as HTMLInputElement | null
      const cursorBefore = el?.selectionStart ?? typed.length
      const significantBefore = countSignificant(typed.slice(0, cursorBefore), group)

      const raw = parseLocalizedNumber(typed, locale)
      if (raw === null) {
        return
      }

      onChangeRaw(raw)

      // Cursor will be restored in useLayoutEffect to the position with the same digit count
      // in the resulting formatted display. We can't know the actual next display here (parent
      // may reject the change), so we recompute against the input element's value after commit.
      pendingCursorRef.current = significantBefore
    },
    [locale, group, onChangeRaw],
  )

  useLayoutEffect(() => {
    const el = inputRef.current as unknown as HTMLInputElement | null
    if (!el || pendingCursorRef.current === null) {
      return
    }
    const target = indexAfterSignificant({ formatted: el.value, count: pendingCursorRef.current, group })
    el.setSelectionRange(target, target)
    pendingCursorRef.current = null
  })

  return { displayValue, inputRef, handleChange }
}
