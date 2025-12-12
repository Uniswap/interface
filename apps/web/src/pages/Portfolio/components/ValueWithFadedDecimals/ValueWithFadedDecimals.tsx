import { TableText } from 'components/Table/styled'
import { useParseCurrencyAmountParts } from 'pages/Portfolio/components/ValueWithFadedDecimals/parseCurrencyAmountParts'
import { EM_DASH, Text, TextProps } from 'ui/src'

type ValueWithFadedDecimalsProps = {
  value: string
  isTableText?: boolean
  textProps?: TextProps
}

export function ValueWithFadedDecimals({ value, isTableText, textProps }: ValueWithFadedDecimalsProps) {
  const { prefixSymbol, wholeNumber, decimalNumber, suffixSymbol, suffix, decimalSeparator } =
    useParseCurrencyAmountParts(value)

  const TextComponent = isTableText ? TableText : Text

  if (!value) {
    return <TextComponent {...textProps}>{EM_DASH}</TextComponent>
  }

  return (
    <TextComponent {...textProps}>
      {prefixSymbol}
      {wholeNumber}
      {decimalNumber && (
        <>
          {/* $neutral2 needs to be last so it overrides the textProps color */}
          <TextComponent {...textProps} color="$neutral2">
            {decimalSeparator}
            {decimalNumber}
          </TextComponent>
          {suffix}
        </>
      )}
      {suffixSymbol}
    </TextComponent>
  )
}
