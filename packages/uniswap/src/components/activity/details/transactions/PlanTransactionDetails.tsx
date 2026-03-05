import { Flex, Text } from 'ui/src'
import { ArrowDown, InfoCircle } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import {
  TwoTokenDetails,
  useTokenAmountInfo,
} from 'uniswap/src/components/activity/details/transactions/utilityComponents'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useIntermediaryPlanState } from 'uniswap/src/features/transactions/swap/plan/intermediaryState/useIntermediaryPlanState'
import { useIntermediaryPlanStateDescriptor } from 'uniswap/src/features/transactions/swap/plan/intermediaryState/useIntermediaryPlanStateDescriptor'
import { PlanTransactionInfo, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyId } from 'uniswap/src/utils/currencyId'

/**
 * This component displays the details of a plan transaction. If partially executed,
 * it will display intermediary state.
 *
 * @param onClose - The function to call when the transaction details are closed
 * @param disableClick - Whether to disable the click handler
 * @returns
 */
export function PlanTransactionDetails({
  status,
  typeInfo,
  onClose,
  disableClick,
}: {
  status: TransactionStatus
  typeInfo: PlanTransactionInfo
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
    <>
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
      <IntermediaryStateCard typeInfo={typeInfo} status={status} />
    </>
  )
}

/**
 * In the case that the plan is interrupted and the user is left with an intermediary token,
 * we display a card with the intermediary token and amount.
 *
 * Example:
 *
 * Your USDC was swapped to 1000 USDT
 *
 * @param inputCurrencySymbol - The symbol of the input currency
 * @param intermediaryCurrencyId - The id of the intermediary currency
 * @param intermediaryAmountRaw - The amount of the intermediary currency
 * @returns
 */
const IntermediaryStateCard = ({
  typeInfo,
  status,
}: {
  typeInfo: PlanTransactionInfo
  status: TransactionStatus
}): JSX.Element | null => {
  const intermediaryState = useIntermediaryPlanState({ typeInfo, status })
  const descriptor = useIntermediaryPlanStateDescriptor({ intermediaryState, status })

  const intermediaryCurrencyInfo = useCurrencyInfo(currencyId(intermediaryState.intermediaryCurrencyAmount?.currency))

  if (!descriptor || !intermediaryCurrencyInfo) {
    return null
  }

  return (
    <Flex
      row
      justifyContent="space-between"
      backgroundColor="$surface2"
      borderRadius="$rounded12"
      p="$spacing12"
      mx="$spacing4"
      alignItems="center"
      gap="$spacing12"
    >
      <Flex row gap="$spacing12" alignItems="center" flexShrink={1}>
        <InfoCircle color="$neutral3" size="$icon.16" />
        <Text flexWrap="wrap" flexShrink={1} color="$neutral1" variant="body3">
          {descriptor}
        </Text>
      </Flex>
      <Flex>
        <CurrencyLogo hideNetworkLogo currencyInfo={intermediaryCurrencyInfo} size={iconSizes.icon24} />
      </Flex>
    </Flex>
  )
}
