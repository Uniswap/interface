import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

function calculatePercentageDifference({
  derivedSwapInfo,
  acceptedDerivedSwapInfo,
}: {
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
}): string | null {
  const derivedCurrencyField =
    derivedSwapInfo.exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

  // It's important to convert these to fractions before doing math on them in order to preserve full precision on each step.
  const newAmount = derivedSwapInfo.currencyAmounts[derivedCurrencyField]?.asFraction
  const acceptedAmount = acceptedDerivedSwapInfo.currencyAmounts[derivedCurrencyField]?.asFraction

  if (!newAmount || !acceptedAmount) {
    return null
  }

  const percentage = newAmount.subtract(acceptedAmount).divide(acceptedAmount).multiply(100)

  return `${percentage.greaterThan(0) ? '+' : ''}${percentage.toFixed(2)}`
}

export function AcceptNewQuoteRow({
  acceptedDerivedSwapInfo,
  derivedSwapInfo,
  onAcceptTrade,
}: {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  onAcceptTrade: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()

  const derivedCurrencyField =
    derivedSwapInfo.exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

  const derivedAmount = derivedSwapInfo.currencyAmounts[derivedCurrencyField]
  const derivedSymbol = getSymbolDisplayText(derivedSwapInfo.currencies[derivedCurrencyField]?.currency.symbol)
  const formattedDerivedAmount = formatCurrencyAmount({
    value: derivedAmount,
    type: NumberType.TokenTx,
  })

  const percentageDifference = calculatePercentageDifference({
    derivedSwapInfo,
    acceptedDerivedSwapInfo,
  })

  return (
    <Flex
      row
      shrink
      alignItems="center"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      gap="$spacing12"
      justifyContent="space-between"
      pl="$spacing12"
      pr="$spacing8"
      py="$spacing8"
    >
      <Flex fill>
        <Text color="$neutral2" variant="body3">
          {t('swap.details.updatedPrice')}
        </Text>
        <Flex row alignItems="center">
          <Text color="$neutral1" numberOfLines={1} variant="body3">
            {formattedDerivedAmount} {derivedSymbol} <Text color="$neutral2">({percentageDifference}%)</Text>
          </Text>
        </Flex>
      </Flex>
      <Trace logPress element={ElementName.AcceptNewRate}>
        <Button
          px="$spacing8"
          width="auto"
          variant="branded"
          emphasis="secondary"
          size="small"
          flex={0}
          onPress={onAcceptTrade}
        >
          {t('common.button.accept')}
        </Button>
      </Trace>
    </Flex>
  )
}
