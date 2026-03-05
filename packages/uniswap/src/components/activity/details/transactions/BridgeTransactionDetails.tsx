import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import {
  TwoTokenDetails,
  useTokenAmountInfo,
} from 'uniswap/src/components/activity/details/transactions/utilityComponents'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { BridgeTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * This component displays the details of a bridge transaction.
 *
 * @param onClose - The function to call when the transaction details are closed
 * @param disableClick - Whether to disable the click handler
 * @returns
 */
export function BridgeTransactionDetails({
  typeInfo,
  onClose,
  disableClick,
}: {
  typeInfo: BridgeTransactionInfo
  onClose?: () => void
  disableClick?: boolean
}): JSX.Element {
  const inputCurrency = useCurrencyInfo(typeInfo.inputCurrencyId)
  const outputCurrency = useCurrencyInfo(typeInfo.outputCurrencyId)

  const { descriptor: inputDescriptor, value: inputValue } = useTokenAmountInfo({
    currency: inputCurrency?.currency,
    amountRaw: typeInfo.inputCurrencyAmountRaw,
    isApproximateAmount: false,
  })
  const { descriptor: outputDescriptor, value: outputValue } = useTokenAmountInfo({
    currency: outputCurrency?.currency,
    amountRaw: typeInfo.outputCurrencyAmountRaw,
    isApproximateAmount: false,
  })

  return (
    <TwoTokenDetails
      inputCurrency={inputCurrency}
      outputCurrency={outputCurrency}
      tokenDescriptorA={inputDescriptor}
      usdValueA={inputValue}
      tokenDescriptorB={outputDescriptor}
      usdValueB={outputValue}
      separatorElement={<ArrowDown color="$neutral3" size="$icon.20" />}
      disableClick={disableClick}
      hideNetworkLogos={false}
      onClose={onClose}
    />
  )
}
