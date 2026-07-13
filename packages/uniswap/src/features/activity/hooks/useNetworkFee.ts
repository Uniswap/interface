import { useFormattedCurrencyAmountAndUSDValue } from 'uniswap/src/components/activity/hooks/useFormattedCurrencyAmountAndUSDValue'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTx } from 'uniswap/src/features/transactions/types/utils'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'

export function useNetworkFee(transactionDetails: TransactionDetails): {
  value: string
  amount: string
  isLoading: boolean
} {
  const formatter = useLocalizationContext()

  const currencyId = transactionDetails.networkFee
    ? buildCurrencyId(transactionDetails.networkFee.chainId, transactionDetails.networkFee.tokenAddress)
    : buildNativeCurrencyId(transactionDetails.chainId)
  const currencyInfo = useCurrencyInfo(currencyId)

  const currencyAmountRaw =
    transactionDetails.networkFee?.quantity != null
      ? transactionDetails.networkFee.quantity
      : isFinalizedTx(transactionDetails)
        ? '0'
        : undefined

  const { value, amount, hasAmount, hasUSDValue, isLoading } = useFormattedCurrencyAmountAndUSDValue({
    currency: currencyInfo?.currency,
    currencyAmountRaw,
    valueType: transactionDetails.networkFee?.valueType,
    formatter,
    isApproximateAmount: false,
    isUniswapX: isUniswapX(transactionDetails),
  })

  // USD pricing can be unavailable on newly launched chains (e.g. Robinhood);
  // fall back to the fee token amount so the row isn't an empty dash.
  const symbol = getSymbolDisplayText(currencyInfo?.currency.symbol)
  const showTokenAmountFallback =
    !isLoading && !hasUSDValue && hasAmount && transactionDetails.networkFee?.quantity != null && symbol != null

  return {
    value: showTokenAmountFallback ? `${amount} ${symbol}` : value,
    amount,
    isLoading,
  }
}
