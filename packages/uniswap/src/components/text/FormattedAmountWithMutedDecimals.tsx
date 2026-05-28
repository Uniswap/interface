import { Flex, type FlexProps, Text, type TextProps } from 'ui/src'

type SplitFormattedAmount = {
  decimals: string | undefined
  leading: string
  trailing: string | undefined
}

type FormattedAmountWithMutedDecimalsProps = {
  amount: string
  color: TextProps['color']
  decimalColor?: TextProps['color']
  decimalOpacity?: number
  justifyContent?: FlexProps['justifyContent']
  loading?: boolean
  testID?: string
  variant: TextProps['variant']
}

export function FormattedAmountWithMutedDecimals({
  amount,
  color,
  decimalColor,
  decimalOpacity,
  justifyContent = 'flex-start',
  loading,
  testID,
  variant,
}: FormattedAmountWithMutedDecimalsProps): JSX.Element {
  if (loading) {
    return (
      <Flex row alignItems="center" justifyContent={justifyContent} minWidth={0} testID={testID}>
        <Text loading variant={variant} color={color}>
          {amount}
        </Text>
      </Flex>
    )
  }

  const { decimals, leading, trailing } = splitFormattedAmountDecimals(amount)

  return (
    <Flex row alignItems="center" justifyContent={justifyContent} minWidth={0} testID={testID}>
      <Text variant={variant} color={color} numberOfLines={1}>
        {leading}
      </Text>
      {decimals ? (
        <Text variant={variant} color={decimalColor ?? color} opacity={decimalOpacity} numberOfLines={1}>
          {decimals}
        </Text>
      ) : null}
      {trailing ? (
        <Text variant={variant} color={color} numberOfLines={1}>
          {trailing}
        </Text>
      ) : null}
    </Flex>
  )
}

// Targets fiat/portfolio amounts formatted with 1–2 trailing decimal digits (StandardCurrency, TwoDecimalsCurrency).
// The 1–2 digit cap avoids mistaking a 3-digit thousand-separator group (e.g. ",000" in "$1,000") for decimals.
function splitFormattedAmountDecimals(amount: string): SplitFormattedAmount {
  const match = /^(.*)([.,]\d{1,2})([^\d]*)$/.exec(amount)

  if (!match) {
    return { leading: amount, decimals: undefined, trailing: undefined }
  }

  const [, leading = amount, decimals, trailing] = match

  return {
    leading,
    decimals,
    trailing,
  }
}
