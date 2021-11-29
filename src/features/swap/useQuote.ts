import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useQuery } from 'react-query'
import { QuoteResult } from 'src/features/swap/types'
import { serializeQueryParams } from 'src/features/swap/utils'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { logger } from 'src/utils/logger'
import { DEFAULT_DEADLINE_S, DEFAULT_SLIPPAGE_TOLERANCE } from '../../constants/misc'

const ROUTING_API_BASE_URL = 'https://api.uniswap.org/v1'

interface QuoteParams {
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyIn: Currency | null | undefined
  currencyOut: Currency | null | undefined
  tradeType: TradeType
}

/**
 * Fetches quote from Routing API
 * Handles caching, invalidation, polling, etc.
 */
export function useQuote(params: QuoteParams) {
  const recipient = useActiveAccount()

  const { currencyAmount, tradeType, currencyIn, currencyOut } = params
  const { address: tokenInAddress, chainId: tokenInChainId } = currencyIn?.wrapped || {}
  const { address: tokenOutAddress, chainId: tokenOutChainId } = currencyOut?.wrapped || {}

  // builds a unique key to represent the quote in the cache
  const key = [
    currencyAmount?.toExact(),
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
        !currencyAmount ||
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
        amount: currencyAmount.quotient.toString(),
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
        // config.debug ?
        {
          // spoof origin to go around server permissions
          headers: {
            Origin: 'https://app.uniswap.org',
          },
        }
        // : undefined
      )

      if (!response.ok) {
        throw new Error(
          `Routing API response was not ok: ${response.status}: ${response.statusText}`
        )
      }

      return response.json()
    },
    {
      enabled: Boolean(currencyAmount && currencyIn && currencyOut),
      // refetchInterval: 50000,
    }
  )

  return result
}
