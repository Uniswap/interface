import { DEBUG } from 'react-native-dotenv'
import { useQuery } from 'react-query'
import { ChainId } from 'src/constants/chains'
import { QuoteResult } from 'src/features/swap/types'
import { serializeQueryParams } from 'src/features/swap/utils'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { logger } from 'src/utils/logger'
import { DEFAULT_DEADLINE_S, DEFAULT_SLIPPAGE_TOLERANCE } from '../../constants/misc'

const ROUTING_API_BASE_URL = 'https://api.uniswap.org/v1'

interface QuoteParams {
  amount?: string
  tokenInAddress?: Address
  tokenOutAddress?: Address
  chainId?: ChainId
}

// Fetches quote from Routing API with caching and invalidation
export function useQuote(params: QuoteParams) {
  const { amount: amountIn, tokenInAddress: tokenIn, tokenOutAddress: tokenOut, chainId } = params

  const recipient = useActiveAccount()

  return useQuery<QuoteResult>(
    ['swap', params],
    async () => {
      if (!amountIn || !tokenIn || !tokenOut || !chainId) {
        logger.error(
          'useQuote',
          'useQuery',
          'Expected all params to be defined. Query should not be enabled.'
        )
        return
      }

      const queryParams = serializeQueryParams({
        tokenInChainId: chainId,
        tokenOutChainId: chainId,
        tokenInAddress: tokenIn,
        tokenOutAddress: tokenOut,
        // TODO: represent tokenIn|Out as currencies and use `CurrencyAmount`
        // assumes ETH as input
        amount: parseFloat(amountIn) * 1e18,
        type: 'exactIn',
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
        DEBUG
          ? {
              // spoof origin to go around server permissions
              headers: {
                origin: 'https://app.uniswap.org',
              },
            }
          : undefined
      )

      if (!response.ok) {
        throw new Error('Routing API response was not okay')
      }

      return response.json()
    },
    {
      enabled: Boolean(amountIn && tokenIn && tokenOut && chainId),
      // refetchInterval: 50000,
    }
  )
}
