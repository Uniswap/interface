import { useCallback } from 'react'
import type { TokenGroupMember } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useGetTokenGroupQuery'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import type { RWAToken } from 'uniswap/src/features/rwa/types'
import { type RWAIssuerMarketData, rwaTokenMarketDataKey } from 'uniswap/src/features/rwa/useRWAIssuerMarketData'
import { useRwaTokenGroup } from 'uniswap/src/features/rwa/useRwaTokenGroup'

const EMPTY_TOKENS: RWAToken[] = []
const EMPTY_MARKET_DATA: RWAIssuerMarketData = {}

/** Siblings for the TDP "More X tokens" module, from the GetTokenGroup response. */
export function useMoreRwaTokens({
  rwaMatch,
  subject,
}: {
  rwaMatch: RWAMatch | undefined
  subject: TokenGroupMember | undefined
}): { otherIssuerTokens: RWAToken[]; getMarketData: (token: RWAToken) => RWAIssuerMarketData } {
  // Only after the page's match hook resolved a group, so this reads the cached response and never
  // issues GetTokenGroup for an ungrouped token.
  const { tokenGroup } = useRwaTokenGroup({ subject, enabled: rwaMatch !== undefined })

  const getMarketData = useCallback(
    (token: RWAToken): RWAIssuerMarketData =>
      tokenGroup?.marketDataByToken.get(rwaTokenMarketDataKey(token)) ?? EMPTY_MARKET_DATA,
    [tokenGroup?.marketDataByToken],
  )

  return { otherIssuerTokens: tokenGroup?.otherIssuerTokens ?? EMPTY_TOKENS, getMarketData }
}
