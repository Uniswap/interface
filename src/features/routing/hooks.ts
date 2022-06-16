import { skipToken } from '@reduxjs/toolkit/dist/query'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { PollingInterval } from 'src/constants/misc'
import { useQuoteQuery } from 'src/features/routing/routingApi'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { currencyAddress } from 'src/utils/currencyId'

export interface UseQuoteProps {
  amountSpecified: CurrencyAmount<Currency> | null | undefined
  otherCurrency: Currency | null | undefined
  tradeType: TradeType
}

/**
 * Fetches quote from Routing API
 */
export function useRouterQuote(params: UseQuoteProps) {
  const recipient = useActiveAccount()

  const { amountSpecified, tradeType, otherCurrency } = params

  const currencyIn = tradeType === TradeType.EXACT_INPUT ? amountSpecified?.currency : otherCurrency
  const currencyOut =
    tradeType === TradeType.EXACT_OUTPUT ? amountSpecified?.currency : otherCurrency

  const tokenInAddress = currencyIn ? currencyAddress(currencyIn) : undefined
  const tokenInChainId = currencyIn?.chainId
  const tokenOutAddress = currencyOut ? currencyAddress(currencyOut) : undefined
  const tokenOutChainId = currencyOut?.chainId

  const skipQuery =
    !amountSpecified || !tokenInAddress || !tokenOutAddress || !tokenInChainId || !tokenOutChainId

  const result = useQuoteQuery(
    skipQuery
      ? skipToken
      : {
          tokenInAddress,
          tokenInChainId,
          tokenOutAddress,
          tokenOutChainId,
          amount: amountSpecified.quotient.toString(),
          type: tradeType === TradeType.EXACT_INPUT ? 'exactIn' : 'exactOut',
          recipient: recipient?.address,
        },
    {
      pollingInterval: PollingInterval.Fast,
    }
  )

  return result
}
