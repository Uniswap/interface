import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback } from 'react'
import { isWeb } from 'ui/src'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails, isFinalizedTx } from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useFormattedCurrencyAmountAndUSDValue } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/utils'

export function useNetworkFee(transactionDetails: TransactionDetails): {
  value: string
  amount: string
} {
  const formatter = useLocalizationContext()

  const currencyId = transactionDetails.networkFee
    ? buildCurrencyId(transactionDetails.chainId, transactionDetails.networkFee.tokenAddress)
    : buildNativeCurrencyId(transactionDetails.chainId)
  const currencyInfo = useCurrencyInfo(currencyId)

  const currencyAmountRaw =
    transactionDetails.networkFee?.quantity != null
      ? transactionDetails.networkFee.quantity
      : isFinalizedTx(transactionDetails)
        ? '0'
        : undefined

  return useFormattedCurrencyAmountAndUSDValue({
    currency: currencyInfo?.currency,
    currencyAmountRaw,
    valueType: ValueType.Exact,
    formatter,
    isApproximateAmount: false,
    isUniswapX: isUniswapX(transactionDetails),
  })
}

export function useTokenDetailsNavigation(currency: Maybe<CurrencyInfo>, onClose?: () => void): () => void {
  const { navigateToTokenDetails } = useWalletNavigation()

  return useCallback(() => {
    if (currency) {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.TokenItem,
        modal: ModalName.TransactionDetails,
      })

      navigateToTokenDetails(currency.currencyId)
      if (!isWeb) {
        onClose?.()
      }
    }
  }, [currency, navigateToTokenDetails, onClose])
}
