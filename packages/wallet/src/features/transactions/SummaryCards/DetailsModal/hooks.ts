import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { useFormattedCurrencyAmountAndUSDValue } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/utils'
import { isUniswapX } from 'wallet/src/features/transactions/swap/trade/utils'
import { TransactionDetails } from 'wallet/src/features/transactions/types'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'
import { ValueType } from 'wallet/src/utils/getCurrencyAmount'

export function useNetworkFee(transactionDetails: TransactionDetails): {
  value: string
  amount: string
} {
  const formatter = useLocalizationContext()

  const currencyId = transactionDetails.networkFee
    ? buildCurrencyId(transactionDetails.chainId, transactionDetails.networkFee.tokenAddress)
    : undefined
  const currencyInfo = useCurrencyInfo(currencyId)

  return useFormattedCurrencyAmountAndUSDValue({
    currency: currencyInfo?.currency,
    currencyAmountRaw: transactionDetails.networkFee?.quantity,
    valueType: ValueType.Exact,
    formatter,
    isApproximateAmount: false,
    isUniswapX: isUniswapX(transactionDetails),
  })
}
