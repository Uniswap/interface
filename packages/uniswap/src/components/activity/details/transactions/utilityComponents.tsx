import { Currency } from '@uniswap/sdk-core'
import { Flex, Loader, Text, TouchableArea } from 'ui/src'
import { fonts, iconSizes } from 'ui/src/theme'
import { useFormattedCurrencyAmountAndUSDValue } from 'uniswap/src/components/activity/hooks/useFormattedCurrencyAmountAndUSDValue'
import { useTokenDetailsNavigation } from 'uniswap/src/components/activity/hooks/useTokenDetailsNavigation'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

export function useTokenAmountInfo({
  currency,
  amountRaw,
  isApproximateAmount = false,
}: {
  currency: Maybe<Currency>
  amountRaw: string
  isApproximateAmount?: boolean
}): { descriptor: string; value: string } {
  const formatter = useLocalizationContext()
  const symbol = getSymbolDisplayText(currency?.symbol)
  const { tilde, amount, value } = useFormattedCurrencyAmountAndUSDValue({
    currency,
    currencyAmountRaw: amountRaw,
    formatter,
    isApproximateAmount,
  })

  return { descriptor: `${tilde}${amount} ${symbol ?? ''}`, value }
}

export function TwoTokenDetails({
  inputCurrency,
  outputCurrency,
  tokenDescriptorA,
  usdValueA,
  tokenDescriptorB,
  usdValueB,
  separatorElement,
  disableClick,
  onClose,
}: {
  inputCurrency: Maybe<CurrencyInfo>
  outputCurrency: Maybe<CurrencyInfo>
  tokenDescriptorA: string
  usdValueA: string
  tokenDescriptorB: string
  usdValueB: string
  separatorElement: JSX.Element
  disableClick?: boolean
  onClose?: () => void
}): JSX.Element {
  const onPressTokenA = useTokenDetailsNavigation(inputCurrency, onClose)
  const onPressTokenB = useTokenDetailsNavigation(outputCurrency, onClose)

  return (
    <Flex gap="$spacing16" px="$spacing8" py="$spacing12">
      <TouchableArea cursor={disableClick ? 'default' : 'pointer'} onPress={disableClick ? undefined : onPressTokenA}>
        <Flex centered row justifyContent="space-between">
          <Flex>
            <Text variant="heading3">{tokenDescriptorA}</Text>
            <ValueText value={usdValueA} />
          </Flex>
          <CurrencyLogo hideNetworkLogo currencyInfo={inputCurrency} size={iconSizes.icon40} />
        </Flex>
      </TouchableArea>
      <Flex>{separatorElement}</Flex>
      <TouchableArea onPress={disableClick ? undefined : onPressTokenB}>
        <Flex centered row justifyContent="space-between">
          <Flex>
            <Text variant="heading3">{tokenDescriptorB}</Text>
            <ValueText value={usdValueB} />
          </Flex>
          <CurrencyLogo hideNetworkLogo currencyInfo={outputCurrency} size={iconSizes.icon40} />
        </Flex>
      </TouchableArea>
    </Flex>
  )
}

export function ValueText({ value }: { value: string }): JSX.Element {
  const isLoading = value === '-'
  return isLoading ? (
    <Loader.Box height={fonts.body3.lineHeight} width={iconSizes.icon36} />
  ) : (
    <Text color="$neutral2" variant="body3">
      {value}
    </Text>
  )
}
