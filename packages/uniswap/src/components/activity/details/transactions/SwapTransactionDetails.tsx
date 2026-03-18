import { TradeType } from '@uniswap/sdk-core'
import { useSporeColors } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { iconSizes } from 'ui/src/theme'
import {
  TwoTokenDetails,
  useTokenAmountInfo,
} from 'uniswap/src/components/activity/details/transactions/utilityComponents'
import { SwapTypeTransactionInfo } from 'uniswap/src/components/activity/details/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { getAmountsFromTrade } from 'uniswap/src/features/transactions/swap/utils/getAmountsFromTrade'
import { isConfirmedSwapTypeInfo } from 'uniswap/src/features/transactions/types/utils'

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

  const { descriptor: inputDescriptor, value: inputValue } = useTokenAmountInfo({
    currency: inputCurrency?.currency,
    amountRaw: inputCurrencyAmountRaw,
    isApproximateAmount: isConfirmed ? false : tradeType === TradeType.EXACT_OUTPUT,
  })
  const { descriptor: outputDescriptor, value: outputValue } = useTokenAmountInfo({
    currency: outputCurrency?.currency,
    amountRaw: outputCurrencyAmountRaw,
    isApproximateAmount: isConfirmed ? false : tradeType === TradeType.EXACT_INPUT,
  })

  return (
    <TwoTokenDetails
      inputCurrency={inputCurrency}
      outputCurrency={outputCurrency}
      tokenDescriptorA={inputDescriptor}
      usdValueA={inputValue}
      tokenDescriptorB={outputDescriptor}
      usdValueB={outputValue}
      separatorElement={<Arrow color={colors.neutral3.val} direction="s" size={iconSizes.icon20} />}
      disableClick={disableClick}
      onClose={onClose}
    />
  )
}
