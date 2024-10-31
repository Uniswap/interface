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
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
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
