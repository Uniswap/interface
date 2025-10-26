import { TableText } from 'components/Table/styled'
import { useParseCurrencyAmountParts } from 'pages/Portfolio/components/ValueWithFadedDecimals/parseCurrencyAmountParts'
import { EM_DASH } from 'ui/src'

export function ValueWithFadedDecimals({ value }: { value: string }) {
  const { prefixSymbol, wholeNumber, decimalNumber, suffixSymbol, suffix, decimalSeparator } =
    useParseCurrencyAmountParts(value)

  if (!value) {
    return <TableText>{EM_DASH}</TableText>
  }

  return (
    <TableText>
      {prefixSymbol}
      {wholeNumber}
      {decimalNumber && (
        <>
          <TableText color="$neutral2">
            {decimalSeparator}
            {decimalNumber}
          </TableText>
          {suffix}
        </>
      )}
      {suffixSymbol}
    </TableText>
  )
}
