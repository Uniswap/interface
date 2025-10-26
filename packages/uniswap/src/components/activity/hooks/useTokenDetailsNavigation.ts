import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback } from 'react'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isWebPlatform } from 'utilities/src/platform'

export function useTokenDetailsNavigation(currency: Maybe<CurrencyInfo>, onClose?: () => void): () => void {
  const { navigateToTokenDetails } = useUniswapContext()

  return useCallback(() => {
    if (currency) {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.TokenItem,
        modal: ModalName.TransactionDetails,
      })

      navigateToTokenDetails(currency.currencyId)
      if (!isWebPlatform) {
        onClose?.()
      }
    }
  }, [currency, navigateToTokenDetails, onClose])
}
