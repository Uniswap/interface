import { Currency } from '@uniswap/sdk-core'
import { Flex, Loader, Text, TouchableArea } from 'ui/src'
import { fonts, iconSizes, validColor } from 'ui/src/theme'
import { useFormattedCurrencyAmountAndUSDValue } from 'uniswap/src/components/activity/hooks/useFormattedCurrencyAmountAndUSDValue'
import { useTokenDetailsNavigation } from 'uniswap/src/components/activity/hooks/useTokenDetailsNavigation'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useNetworkColors } from 'uniswap/src/utils/colors'
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
  hideNetworkLogos = true,
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
  hideNetworkLogos?: boolean
}): JSX.Element {
  const onPressTokenA = useTokenDetailsNavigation(inputCurrency, onClose)
  const onPressTokenB = useTokenDetailsNavigation(outputCurrency, onClose)

  const tokenAChainId = toSupportedChainId(inputCurrency?.currency.chainId)
  const tokenBChainId = toSupportedChainId(outputCurrency?.currency.chainId)
  return (
    <Flex gap="$spacing16" px="$spacing8" py="$spacing12">
      <TouchableArea cursor={disableClick ? 'default' : 'pointer'} onPress={disableClick ? undefined : onPressTokenA}>
        {tokenAChainId && !hideNetworkLogos && <NetworkLabel chainId={tokenAChainId} />}
        <Flex centered row justifyContent="space-between">
          <Flex>
            <Text variant="heading3">{tokenDescriptorA}</Text>
            <ValueText value={usdValueA} />
          </Flex>
          <CurrencyLogo hideNetworkLogo={hideNetworkLogos} currencyInfo={inputCurrency} size={iconSizes.icon40} />
        </Flex>
      </TouchableArea>
      <Flex>{separatorElement}</Flex>
      <TouchableArea onPress={disableClick ? undefined : onPressTokenB}>
        {tokenBChainId && !hideNetworkLogos && <NetworkLabel chainId={tokenBChainId} />}
        <Flex centered row justifyContent="space-between">
          <Flex>
            <Text variant="heading3">{tokenDescriptorB}</Text>
            <ValueText value={usdValueB} />
          </Flex>
          <CurrencyLogo hideNetworkLogo={hideNetworkLogos} currencyInfo={outputCurrency} size={iconSizes.icon40} />
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

function NetworkLabel({ chainId }: { chainId: UniverseChainId }): JSX.Element {
  const networkLabel = getChainLabel(chainId)
  const networkColors = useNetworkColors(chainId)
  const networkColor = validColor(networkColors.foreground)

  return (
    <Flex row gap="$spacing4" alignItems="center" mb="$spacing4">
      <NetworkLogo chainId={chainId} size={iconSizes.icon16} />
      <Text color={networkColor} variant="buttonLabel3">
        {networkLabel}
      </Text>
    </Flex>
  )
}
