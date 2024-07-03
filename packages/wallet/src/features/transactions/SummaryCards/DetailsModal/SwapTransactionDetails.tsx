import { Currency, TradeType } from '@uniswap/sdk-core'
import { Flex, Text, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { Arrow } from 'wallet/src/components/icons/Arrow'
import {
  LocalizationContextState,
  useLocalizationContext,
} from 'wallet/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { SwapTypeTransactionInfo } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/types'
import { getAmountsFromTrade } from 'wallet/src/features/transactions/getAmountsFromTrade'
import { useUSDCValue } from 'wallet/src/features/transactions/swap/trade/hooks/useUSDCPrice'
import { isConfirmedSwapTypeInfo } from 'wallet/src/features/transactions/types'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

export const SwapTransactionDetails = ({
  typeInfo,
}: {
  typeInfo: SwapTypeTransactionInfo
}): JSX.Element => {
  const colors = useSporeColors()
  const formatter = useLocalizationContext()
  const inputCurrency = useCurrencyInfo(typeInfo.inputCurrencyId)
  const outputCurrency = useCurrencyInfo(typeInfo.outputCurrencyId)

  const isConfirmed = isConfirmedSwapTypeInfo(typeInfo)
  const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = getAmountsFromTrade(typeInfo)
  const {
    tilde: inputTilde,
    amount: inputAmount,
    value: inputValue,
  } = useFormattedCurrencyAmountAndUSDValue(
    inputCurrency?.currency,
    inputCurrencyAmountRaw,
    formatter,
    isConfirmed ? false : typeInfo.tradeType === TradeType.EXACT_OUTPUT
  )
  const {
    tilde: outputTilde,
    amount: outputAmount,
    value: outputValue,
  } = useFormattedCurrencyAmountAndUSDValue(
    outputCurrency?.currency,
    outputCurrencyAmountRaw,
    formatter,
    isConfirmed ? false : typeInfo.tradeType === TradeType.EXACT_INPUT
  )

  const inputSymbol = getSymbolDisplayText(inputCurrency?.currency.symbol)
  const outputSymbol = getSymbolDisplayText(outputCurrency?.currency.symbol)

  return (
    <Flex gap="$spacing16" p="$spacing8">
      <Flex centered row justifyContent="space-between">
        <Flex>
          <Text variant="heading3">
            {inputTilde}
            {inputAmount} {inputSymbol}
          </Text>
          <Text color="$neutral3" variant="body3">
            {inputValue}
          </Text>
        </Flex>
        <CurrencyLogo hideNetworkLogo currencyInfo={inputCurrency} size={iconSizes.icon40} />
      </Flex>
      <Flex>
        <Arrow color={colors.neutral3.val} direction="s" size={iconSizes.icon20} />
      </Flex>
      <Flex centered row justifyContent="space-between">
        <Flex>
          <Text variant="heading3">
            {outputTilde}
            {outputAmount} {outputSymbol}
          </Text>
          <Text color="$neutral3" variant="body3">
            {outputValue}
          </Text>
        </Flex>
        <CurrencyLogo hideNetworkLogo currencyInfo={outputCurrency} size={iconSizes.icon40} />
      </Flex>
    </Flex>
  )
}

function useFormattedCurrencyAmountAndUSDValue(
  currency: Maybe<Currency>,
  currencyAmountRaw: string,
  formatter: LocalizationContextState,
  isApproximateAmount = false,
  valueType = ValueType.Raw
): { amount: string; value: string; tilde: string } {
  const currencyAmount = getCurrencyAmount({
    value: currencyAmountRaw,
    valueType,
    currency,
  })

  const value = useUSDCValue(currencyAmount)
  const formattedAmount = formatter.formatCurrencyAmount({ value: currencyAmount })
  return {
    tilde: isApproximateAmount ? '~' : '',
    amount: `${formattedAmount}`,
    value: formatter.formatCurrencyAmount({ value, type: NumberType.FiatTokenPrice }),
  }
}
