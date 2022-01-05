import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useQuery } from 'react-query'
import { QuoteResult } from 'src/features/prices/types'
import { serializeQueryParams } from 'src/features/swap/utils'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { currencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { DEFAULT_DEADLINE_S, DEFAULT_SLIPPAGE_TOLERANCE } from '../../constants/misc'

const ROUTING_API_BASE_URL = 'https://api.uniswap.org/v1'

export interface UseQuoteProps {
  amountSpecified: CurrencyAmount<Currency> | null | undefined
  otherCurrency: Currency | null | undefined
  tradeType: TradeType
}

/**
 * Fetches quote from Routing API
 * Handles caching, invalidation, polling, etc.
 */
export function useQuote(params: UseQuoteProps) {
  const recipient = useActiveAccount()

  const { amountSpecified, tradeType, otherCurrency } = params

  const currencyIn = tradeType === TradeType.EXACT_INPUT ? amountSpecified?.currency : otherCurrency
  const currencyOut =
    tradeType === TradeType.EXACT_OUTPUT ? amountSpecified?.currency : otherCurrency

  const tokenInAddress = currencyIn ? currencyId(currencyIn) : undefined
  const tokenInChainId = currencyIn?.chainId
  const tokenOutAddress = currencyOut ? currencyId(currencyOut) : undefined
  const tokenOutChainId = currencyOut?.chainId

  // builds a unique key to represent the quote in the cache
  const key = [
    amountSpecified?.quotient.toString(),
    tradeType,
    tokenInAddress,
    tokenOutAddress,
    tokenInChainId,
    tokenOutChainId,
  ]

  const result = useQuery<QuoteResult>(
    ['swap', key],
    async () => {
      if (
        !amountSpecified ||
        !tokenInAddress ||
        !tokenOutAddress ||
        !tokenInChainId ||
        !tokenOutChainId
      ) {
        logger.error(
          'useQuote',
          'useQuery',
          'Unexpected. Ensure all required params are included in `enabled`'
        )
        return
      }

      const queryParams = serializeQueryParams({
        tokenInChainId,
        tokenOutChainId,
        tokenInAddress,
        tokenOutAddress,
        amount: amountSpecified.quotient.toString(),
        type: tradeType === TradeType.EXACT_INPUT ? 'exactIn' : 'exactOut',
        protocols: 'v3',
        ...(recipient
          ? {
              recipient: recipient.address,
              slippageTolerance: DEFAULT_SLIPPAGE_TOLERANCE,
              deadline: DEFAULT_DEADLINE_S,
            }
          : {}),
      })

      const response = await fetch(
        `${ROUTING_API_BASE_URL}/quote?${queryParams}`,
        // TODO remove once routing api officially supports mobile
        // config.debug ?
        {
          // spoof origin to go around server permissions
          headers: {
            Origin: 'https://app.uniswap.org',
          },
        }
        // : undefined
      )

      // routing api returns errors inside the json blob, safe to unwrap
      const blob = await response.json()

      if (!response.ok) {
        throw new Error(
          `Routing API response was not ok: ${response.status}: ${JSON.stringify(blob)}`
        )
      }

      return blob
    },
    {
      enabled: Boolean(amountSpecified && otherCurrency),
      // TODO: re-enable once ready
      // refetchInterval: 50000,
    }
  )

  return result
}
