import { Flex, Text, TouchableArea } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { iconSizes, validColor } from 'ui/src/theme'
import { ValueText } from 'uniswap/src/components/activity/details/transactions/utilityComponents'
import { useFormattedCurrencyAmountAndUSDValue } from 'uniswap/src/components/activity/hooks/useFormattedCurrencyAmountAndUSDValue'
import { useTokenDetailsNavigation } from 'uniswap/src/components/activity/hooks/useTokenDetailsNavigation'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainLabel, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { BridgeTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useNetworkColors } from 'uniswap/src/utils/colors'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

export function BridgeTransactionDetails({
  typeInfo,
  onClose,
  disableClick,
}: {
  typeInfo: BridgeTransactionInfo
  onClose?: () => void
  disableClick?: boolean
}): JSX.Element {
  const formatter = useLocalizationContext()

  const inputCurrency = useCurrencyInfo(typeInfo.inputCurrencyId)
  const outputCurrency = useCurrencyInfo(typeInfo.outputCurrencyId)

  const { amount: inputAmount, value: inputValue } = useFormattedCurrencyAmountAndUSDValue({
    currency: inputCurrency?.currency,
    currencyAmountRaw: typeInfo.inputCurrencyAmountRaw,
    formatter,
    isApproximateAmount: false,
  })
  const { amount: outputAmount, value: outputValue } = useFormattedCurrencyAmountAndUSDValue({
    currency: outputCurrency?.currency,
    currencyAmountRaw: typeInfo.outputCurrencyAmountRaw,
    formatter,
    isApproximateAmount: false,
  })

  // This should never happen. It's just to keep TS happy.
  if (!inputCurrency || !outputCurrency) {
    throw new Error('Missing required `currencyAmount` to render `TransactionAmountsReview`')
  }

  const onPressInputToken = useTokenDetailsNavigation(inputCurrency, onClose)
  const onPressOutputToken = useTokenDetailsNavigation(outputCurrency, onClose)

  return (
    <Flex $short={{ gap: '$spacing8' }} gap="$spacing16" px="$spacing8" py="$spacing12">
      <TouchableArea onPress={disableClick ? undefined : onPressInputToken}>
        <CurrencyValueWithIcon
          currencyInfo={inputCurrency}
          formattedFiatAmount={inputValue}
          formattedTokenAmount={inputAmount}
        />
      </TouchableArea>

      <ArrowDown color="$neutral3" size="$icon.20" />

      <TouchableArea onPress={disableClick ? undefined : onPressOutputToken}>
        <CurrencyValueWithIcon
          currencyInfo={outputCurrency}
          formattedFiatAmount={outputValue}
          formattedTokenAmount={outputAmount}
        />
      </TouchableArea>
    </Flex>
  )
}

export function CurrencyValueWithIcon({
  currencyInfo,
  formattedFiatAmount,
  formattedTokenAmount,
}: {
  currencyInfo: CurrencyInfo
  formattedFiatAmount: string
  formattedTokenAmount: string
}): JSX.Element {
  const { defaultChainId } = useEnabledChains()
  const chainId = toSupportedChainId(currencyInfo.currency.chainId) ?? defaultChainId
  const networkColors = useNetworkColors(chainId)
  const networkLabel = getChainLabel(chainId)
  const networkColor = validColor(networkColors.foreground)

  return (
    <Flex centered grow row>
      <Flex grow gap="$spacing4">
        <Flex row gap="$spacing4" alignItems="center">
          <NetworkLogo chainId={currencyInfo.currency.chainId} size={iconSizes.icon16} />
          <Text color={networkColor} variant="buttonLabel3">
            {networkLabel}
          </Text>
        </Flex>
        <Text color="$neutral1" variant="heading3">
          {formattedTokenAmount} {getSymbolDisplayText(currencyInfo.currency.symbol)}
        </Text>
        <ValueText value={formattedFiatAmount} />
      </Flex>

      <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon40} />
    </Flex>
  )
}
