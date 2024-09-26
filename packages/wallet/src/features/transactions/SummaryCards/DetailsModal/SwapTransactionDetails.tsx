import { SharedEventName } from '@uniswap/analytics-events'
import { TradeType } from '@uniswap/sdk-core'
import { Flex, Loader, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { fonts, iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { isConfirmedSwapTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { SwapTypeTransactionInfo } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/types'
import { useFormattedCurrencyAmountAndUSDValue } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/utils'
import { getAmountsFromTrade } from 'wallet/src/features/transactions/getAmountsFromTrade'

export function SwapTransactionDetails({
  typeInfo,
  onClose,
  disableClick,
}: {
  typeInfo: SwapTypeTransactionInfo
  onClose?: () => void
  disableClick?: boolean
}): JSX.Element {
  const inputCurrency = useCurrencyInfo(typeInfo.inputCurrencyId)
  const outputCurrency = useCurrencyInfo(typeInfo.outputCurrencyId)

  const isConfirmed = isConfirmedSwapTypeInfo(typeInfo)
  const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = getAmountsFromTrade(typeInfo)

  return (
    <SwapTransactionContent
      disableClick={disableClick}
      inputCurrency={inputCurrency}
      inputCurrencyAmountRaw={inputCurrencyAmountRaw}
      isConfirmed={isConfirmed}
      outputCurrency={outputCurrency}
      outputCurrencyAmountRaw={outputCurrencyAmountRaw}
      tradeType={typeInfo.tradeType}
      onClose={onClose}
    />
  )
}

export function SwapTransactionContent({
  inputCurrency,
  outputCurrency,
  isConfirmed,
  inputCurrencyAmountRaw,
  outputCurrencyAmountRaw,
  tradeType,
  onClose,
  disableClick,
}: {
  inputCurrency: Maybe<CurrencyInfo>
  outputCurrency: Maybe<CurrencyInfo>
  isConfirmed: boolean
  inputCurrencyAmountRaw: string
  outputCurrencyAmountRaw: string
  tradeType?: TradeType
  onClose?: () => void
  disableClick?: boolean
}): JSX.Element {
  const colors = useSporeColors()
  const formatter = useLocalizationContext()
  const { navigateToTokenDetails } = useWalletNavigation()

  const {
    tilde: inputTilde,
    amount: inputAmount,
    value: inputValue,
  } = useFormattedCurrencyAmountAndUSDValue({
    currency: inputCurrency?.currency,
    currencyAmountRaw: inputCurrencyAmountRaw,
    formatter,
    isApproximateAmount: isConfirmed ? false : tradeType === TradeType.EXACT_OUTPUT,
  })
  const {
    tilde: outputTilde,
    amount: outputAmount,
    value: outputValue,
  } = useFormattedCurrencyAmountAndUSDValue({
    currency: outputCurrency?.currency,
    currencyAmountRaw: outputCurrencyAmountRaw,
    formatter,
    isApproximateAmount: isConfirmed ? false : tradeType === TradeType.EXACT_INPUT,
  })
  const inputSymbol = getSymbolDisplayText(inputCurrency?.currency.symbol)
  const outputSymbol = getSymbolDisplayText(outputCurrency?.currency.symbol)

  const onPressInputToken = (): void => {
    if (inputCurrency) {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.TokenItem,
        modal: ModalName.TransactionDetails,
      })

      navigateToTokenDetails(inputCurrency.currencyId)
      if (!isWeb) {
        onClose?.()
      }
    }
  }

  const onPressOutputToken = (): void => {
    if (outputCurrency) {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.TokenItem,
        modal: ModalName.TransactionDetails,
      })

      navigateToTokenDetails(outputCurrency.currencyId)
      if (!isWeb) {
        onClose?.()
      }
    }
  }

  return (
    <Flex gap="$spacing16" px="$spacing8" py="$spacing12">
      <TouchableArea
        cursor={disableClick ? 'default' : 'pointer'}
        onPress={disableClick ? undefined : onPressInputToken}
      >
        <Flex centered row justifyContent="space-between">
          <Flex>
            <Text variant="heading3">
              {inputTilde}
              {inputAmount} {inputSymbol}
            </Text>
            <ValueText value={inputValue} />
          </Flex>
          <CurrencyLogo hideNetworkLogo currencyInfo={inputCurrency} size={iconSizes.icon40} />
        </Flex>
      </TouchableArea>
      <Flex>
        <Arrow color={colors.neutral3.val} direction="s" size={iconSizes.icon20} />
      </Flex>
      <TouchableArea onPress={disableClick ? undefined : onPressOutputToken}>
        <Flex centered row justifyContent="space-between">
          <Flex>
            <Text variant="heading3">
              {outputTilde}
              {outputAmount} {outputSymbol}
            </Text>
            <ValueText value={outputValue} />
          </Flex>
          <CurrencyLogo hideNetworkLogo currencyInfo={outputCurrency} size={iconSizes.icon40} />
        </Flex>
      </TouchableArea>
    </Flex>
  )
}

function ValueText({ value }: { value: string }): JSX.Element {
  const isLoading = value === '-'
  return isLoading ? (
    <Loader.Box height={fonts.body3.lineHeight} width={iconSizes.icon36} />
  ) : (
    <Text color="$neutral2" variant="body3">
      {value}
    </Text>
  )
}
