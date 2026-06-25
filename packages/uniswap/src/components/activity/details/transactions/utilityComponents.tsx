import { Currency } from '@uniswap/sdk-core'
import { Flex, Loader, Text } from 'ui/src'
import { fonts, iconSizes, validColor } from 'ui/src/theme'
import { TransactionTokenContextMenu } from 'uniswap/src/components/activity/details/transactions/TransactionTokenContextMenu'
import { useFormattedCurrencyAmountAndUSDValue } from 'uniswap/src/components/activity/hooks/useFormattedCurrencyAmountAndUSDValue'
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
}): { descriptor: string; value: string; isLoading: boolean } {
  const formatter = useLocalizationContext()
  const symbol = getSymbolDisplayText(currency?.symbol)
  const { tilde, amount, value, isLoading } = useFormattedCurrencyAmountAndUSDValue({
    currency,
    currencyAmountRaw: amountRaw,
    formatter,
    isApproximateAmount,
  })

  return { descriptor: `${tilde}${amount} ${symbol ?? ''}`, value, isLoading }
}

export function TwoTokenDetails({
  inputCurrency,
  outputCurrency,
  tokenDescriptorA,
  usdValueA,
  tokenDescriptorB,
  usdValueB,
  isLoadingA,
  isLoadingB,
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
  isLoadingA?: boolean
  isLoadingB?: boolean
  separatorElement: JSX.Element
  disableClick?: boolean
  onClose?: () => void
  hideNetworkLogos?: boolean
}): JSX.Element {
  const tokenAChainId = toSupportedChainId(inputCurrency?.currency.chainId)
  const tokenBChainId = toSupportedChainId(outputCurrency?.currency.chainId)
  return (
    <Flex gap="$spacing16" px="$spacing8" py="$spacing12">
      <Flex>
        {tokenAChainId && !hideNetworkLogos && <NetworkLabel chainId={tokenAChainId} />}
        <Flex centered row justifyContent="space-between">
          <Flex>
            <Text variant="heading3">{tokenDescriptorA}</Text>
            <ValueText value={usdValueA} isLoading={isLoadingA} />
          </Flex>
          <TransactionTokenContextMenu currencyInfo={inputCurrency} disabled={disableClick} onClose={onClose}>
            <CurrencyLogo hideNetworkLogo={hideNetworkLogos} currencyInfo={inputCurrency} size={iconSizes.icon40} />
          </TransactionTokenContextMenu>
        </Flex>
      </Flex>
      <Flex>{separatorElement}</Flex>
      <Flex>
        {tokenBChainId && !hideNetworkLogos && <NetworkLabel chainId={tokenBChainId} />}
        <Flex centered row justifyContent="space-between">
          <Flex>
            <Text variant="heading3">{tokenDescriptorB}</Text>
            <ValueText value={usdValueB} isLoading={isLoadingB} />
          </Flex>
          <TransactionTokenContextMenu currencyInfo={outputCurrency} disabled={disableClick} onClose={onClose}>
            <CurrencyLogo hideNetworkLogo={hideNetworkLogos} currencyInfo={outputCurrency} size={iconSizes.icon40} />
          </TransactionTokenContextMenu>
        </Flex>
      </Flex>
    </Flex>
  )
}

export function ValueText({ value, isLoading }: { value: string; isLoading?: boolean }): JSX.Element {
  if (isLoading) {
    return <Loader.Box height={fonts.body3.lineHeight} width={iconSizes.icon36} />
  }
  return (
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
