import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useFormattedCurrencyAmountAndUSDValue } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/utils'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

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
