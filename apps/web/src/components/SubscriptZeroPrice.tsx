import { useMemo } from 'react'
import { Flex, Text, TextProps } from 'ui/src'
import { parseForSubscriptNotation, trimFractionalTrailingZeros } from 'utilities/src/format/parseForSubscriptNotation'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'

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
  /** Override font size (takes precedence over variant for sizing) */
  fontSize?: number
  /** Override line height */
  lineHeight?: number
  /** Color for the main number */
  color?: TextProps['color']
  /** When true, skip the MouseoverTooltip wrapper (use when already inside a tooltip) */
  disableTooltip?: boolean
}

/**
 * A component that displays small decimal numbers with subscript notation for leading zeros.
 *
 * For example, 0.00001024 ETH becomes "0.0₅1024 ETH" where ₅ is a subscript
 * indicating 5 zeros after the decimal point.
 */
export function SubscriptZeroPrice({
  value,
  symbol,
  prefix,
  minSignificantDigits = 2,
  maxSignificantDigits = 4,
  subscriptThreshold = 4,
  variant = 'body3',
  fontSize,
  lineHeight,
  color = '$neutral1',
  disableTooltip,
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

  const sizeProps = fontSize !== undefined ? { fontSize, lineHeight } : {}

  const fullNumberTooltip = useMemo(() => {
    if (!parsed.useSubscript) {
      return null
    }
    const decimalPlaces = parsed.leadingZeros + maxSignificantDigits
    const fullNumber = trimFractionalTrailingZeros(value.toFixed(decimalPlaces))
    return `${prefix ?? ''}${fullNumber}${symbol ? ` ${symbol}` : ''}`
  }, [parsed.useSubscript, parsed.leadingZeros, value, maxSignificantDigits, prefix, symbol])

  if (!parsed.useSubscript) {
    return (
      <Text variant={variant} color={color} {...sizeProps}>
        {prefix ?? ''}
        {parsed.fullFormatted}
        {symbol ? ` ${symbol}` : ''}
      </Text>
    )
  }

  const isHeading = variant.startsWith('heading')
  const subscriptFontSize =
    fontSize !== undefined ? Math.round(fontSize * 0.7) : isHeading ? 12 : variant === 'body3' ? 9 : 10
  const subscriptTopOffset = isHeading ? 5 : 3

  const subscriptContent = (
    <Flex row alignItems="baseline" flexWrap="nowrap" gap="$none">
      <Text variant={variant} color={color} {...sizeProps}>
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
      <Text variant={variant} color={color} {...sizeProps}>
        {parsed.significantPart}
        {symbol ? ` ${symbol}` : ''}
      </Text>
    </Flex>
  )

  if (disableTooltip) {
    return subscriptContent
  }

  return (
    <MouseoverTooltip text={fullNumberTooltip} size={TooltipSize.Max} placement="top">
      {subscriptContent}
    </MouseoverTooltip>
  )
}
