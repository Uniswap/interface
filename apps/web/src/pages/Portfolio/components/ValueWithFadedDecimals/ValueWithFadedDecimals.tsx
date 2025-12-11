import { useParseCurrencyAmountParts } from 'pages/Portfolio/components/ValueWithFadedDecimals/parseCurrencyAmountParts'
import { EM_DASH, Text, TextProps } from 'ui/src'

type ValueWithFadedDecimalsProps = {
  value: string
  textProps?: TextProps
}

export function ValueWithFadedDecimals({ value, textProps }: ValueWithFadedDecimalsProps) {
  const { prefixSymbol, wholeNumber, decimalNumber, suffixSymbol, suffix, decimalSeparator } =
    useParseCurrencyAmountParts(value)

  const textVariant = textProps?.variant ?? 'body3'

  if (!value) {
    return <Text {...textProps}>{EM_DASH}</Text>
  }

  return (
    <Text variant={textVariant} {...textProps}>
      {prefixSymbol}
      {wholeNumber}
      {decimalNumber && (
        <>
          {/* $neutral2 needs to be last so it overrides the textProps color */}
          <Text variant={textVariant} {...textProps} color="$neutral2">
            {decimalSeparator}
            {decimalNumber}
          </Text>
          {suffix}
        </>
      )}
      {suffixSymbol}
    </Text>
  )
}
