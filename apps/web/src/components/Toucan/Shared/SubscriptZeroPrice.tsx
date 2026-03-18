import { useMemo } from 'react'
import { Flex, Text, TextProps } from 'ui/src'
import { getSubscriptNotationParts } from '~/components/Charts/utils/subscriptFormat'
import { roundForDisplay } from '~/components/Toucan/Auction/BidDistributionChart/utils/tokenFormatters'

interface SubscriptZeroPriceProps {
  /** The numeric value to format */
  value: number
  /** Token symbol to display after the number (e.g., "ETH") */
  symbol?: string
  /** Prefix to display before the number (e.g., "$" or "₩") */
  prefix?: string
  /** Minimum significant digits to show (default: 2) */
  minSignificantDigits?: number
  /** Maximum significant digits to show (default: 4) */
  maxSignificantDigits?: number
  /** Threshold for using subscript notation (default: 4 leading zeros after decimal) */
  subscriptThreshold?: number
  /** Text variant for the main number */
  variant?: TextProps['variant']
  /** Color for the main number */
  color?: TextProps['color']
}

interface ParsedSubscriptNumber {
  /** Whether to use subscript notation */
  useSubscript: boolean
  /** Number of leading zeros (for subscript) */
  leadingZeros: number
  /** The significant digits portion */
  significantPart: string
  /** Full formatted string (for non-subscript case) */
  fullFormatted: string
}

interface ParseForSubscriptNotationParams {
  value: number
  minSigDigits: number
  maxSigDigits: number
  subscriptThreshold: number
}

/**
 * Parse a small decimal number for subscript notation display.
 *
 * For very small numbers like 0.00001024, instead of showing all zeros,
 * we can display it as "0.0₅1024" where the subscript 5 indicates 5 zeros.
 */
function parseForSubscriptNotation(params: ParseForSubscriptNotationParams): ParsedSubscriptNumber {
  const { value, minSigDigits, maxSigDigits, subscriptThreshold } = params
  if (value === 0) {
    return {
      useSubscript: false,
      leadingZeros: 0,
      significantPart: '0',
      fullFormatted: '0',
    }
  }

  // Apply display rounding to clean up values like 0.00000999 → 0.00001
  const roundedValue = roundForDisplay(value)
  const absValue = Math.abs(roundedValue)

  // For very large numbers, cap at >999T to avoid formatting issues
  if (absValue >= 1e15) {
    return {
      useSubscript: false,
      leadingZeros: 0,
      significantPart: '>999T',
      fullFormatted: '>999T',
    }
  }

  // For numbers >= 1 or small numbers without many leading zeros, use standard formatting
  if (absValue >= 1) {
    const formatted = new Intl.NumberFormat(undefined, {
      minimumSignificantDigits: Math.min(minSigDigits, 3),
      maximumSignificantDigits: Math.min(maxSigDigits, 6),
      notation: absValue >= 1e6 ? 'compact' : 'standard',
    }).format(roundedValue)
    return {
      useSubscript: false,
      leadingZeros: 0,
      significantPart: formatted,
      fullFormatted: formatted,
    }
  }

  const subscriptParts = getSubscriptNotationParts({
    value: absValue,
    subscriptThreshold,
    maxSigDigits,
  })

  if (subscriptParts?.usesSubscript) {
    return {
      useSubscript: true,
      leadingZeros: subscriptParts.leadingZeros,
      significantPart: subscriptParts.significantPart,
      fullFormatted: `0.0${subscriptParts.leadingZeros}${subscriptParts.significantPart}`,
    }
  }

  // Use standard formatting with appropriate precision
  const formatted = new Intl.NumberFormat(undefined, {
    minimumSignificantDigits: minSigDigits,
    maximumSignificantDigits: maxSigDigits,
  }).format(roundedValue)

  return {
    useSubscript: false,
    leadingZeros: 0,
    significantPart: formatted,
    fullFormatted: formatted,
  }
}

/**
 * A component that displays small decimal numbers with subscript notation for leading zeros.
 *
 * For example, 0.00001024 ETH becomes "0.0₅1024 ETH" where ₅ is a subscript
 * indicating 5 zeros after the decimal point.
 *
 * This is useful for displaying very small token prices without excessive zeros.
 */
export function SubscriptZeroPrice({
  value,
  symbol,
  prefix,
  minSignificantDigits = 2,
  maxSignificantDigits = 4,
  subscriptThreshold = 4,
  variant = 'body3',
  color = '$neutral1',
}: SubscriptZeroPriceProps): JSX.Element {
  const parsed = useMemo(
    () =>
      parseForSubscriptNotation({
        value,
        minSigDigits: minSignificantDigits,
        maxSigDigits: maxSignificantDigits,
        subscriptThreshold,
      }),
    [value, minSignificantDigits, maxSignificantDigits, subscriptThreshold],
  )

  if (!parsed.useSubscript) {
    return (
      <Text variant={variant} color={color}>
        {prefix ?? ''}
        {parsed.fullFormatted}
        {symbol ? ` ${symbol}` : ''}
      </Text>
    )
  }

  // Scale subscript font size based on variant (headings need larger subscripts)
  const isHeading = variant.startsWith('heading')
  const subscriptFontSize = isHeading ? 12 : variant === 'body3' ? 9 : 10
  const subscriptTopOffset = isHeading ? 5 : 3

  return (
    <Flex row alignItems="baseline" gap="$none">
      <Text variant={variant} color={color}>
        {prefix ?? ''}0.0
      </Text>
      <Text
        variant={variant}
        color={color}
        fontSize={subscriptFontSize}
        style={{ position: 'relative', top: subscriptTopOffset, lineHeight: 1 }}
      >
        {parsed.leadingZeros}
      </Text>
      <Text variant={variant} color={color}>
        {parsed.significantPart}
        {symbol ? ` ${symbol}` : ''}
      </Text>
    </Flex>
  )
}
