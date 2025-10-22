import { TradingApi } from '@universe/api'
import { useCallback } from 'react'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'

interface UseLpIncentivesClaimDataParams {
  walletAddress: string
  chainId: number
  tokens: string[]
  distributor: TradingApi.Distributor
}

// Fetch LP incentive claim data from trading API
// The response is transaction data the user can submit to claim their rewards
export function useLpIncentivesClaimData() {
  return useCallback(
    async ({
      walletAddress,
      chainId,
      tokens,
      distributor,
    }: UseLpIncentivesClaimDataParams): Promise<{
      data: TradingApi.ClaimLPRewardsResponse | null
      error: Error | null
    }> => {
      try {
        const response = await TradingApiClient.fetchClaimLpIncentiveRewards({
          walletAddress,
          chainId,
          tokens,
          distributor,
          simulateTransaction: true,
        })
        return { data: response, error: null }
      } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error('Failed to fetch claim data') }
      }
    },
    [],
  )
}
