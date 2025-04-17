import { useCallback } from 'react'
import { fetchClaimLpIncentiveRewards } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { ClaimLPRewardsResponse, Distributor } from 'uniswap/src/data/tradingApi/__generated__'

interface UseLpIncentivesClaimDataParams {
  walletAddress: string
  chainId: number
  tokens: string[]
  distributor: Distributor
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
      data: ClaimLPRewardsResponse | null
      error: Error | null
    }> => {
      try {
        const response = await fetchClaimLpIncentiveRewards({
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
