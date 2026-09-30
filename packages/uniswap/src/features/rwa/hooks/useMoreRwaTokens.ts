import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useCallback, useMemo } from 'react'
import type { TokenGroupMember } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useGetTokenGroupQuery'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import type { RWAToken } from 'uniswap/src/features/rwa/types'
import {
  type RWAIssuerMarketData,
  rwaTokenMarketDataKey,
  useRWAIssuerMarketData,
} from 'uniswap/src/features/rwa/useRWAIssuerMarketData'
import { useRwaTokenGroup } from 'uniswap/src/features/rwa/useRwaTokenGroup'

const EMPTY_TOKENS: RWAToken[] = []
const EMPTY_MARKET_DATA: RWAIssuerMarketData = {}

/**
 * Siblings for the TDP "More X tokens" module: from the GetTokenGroup response with token categories
 * on, otherwise the v1 whitelist siblings with RWAIssuerTokens GraphQL stats.
 */
export function useMoreRwaTokens({
  rwaMatch,
  subject,
}: {
  rwaMatch: RWAMatch | undefined
  subject: TokenGroupMember | undefined
}): { otherIssuerTokens: RWAToken[]; getMarketData: (token: RWAToken) => RWAIssuerMarketData } {
  const isTokenGroupsSource = useIsTokenCategoriesEnabled()
  // Only after the page's match hook resolved a group, so this reads the cached response and never
  // issues GetTokenGroup for an ungrouped token.
  const { tokenGroup } = useRwaTokenGroup({ subject, enabled: isTokenGroupsSource && rwaMatch !== undefined })

  const whitelistSiblings = useMemo(
    () =>
      !isTokenGroupsSource && rwaMatch
        ? rwaMatch.asset.tokens.filter((token) => token.issuer !== rwaMatch.token.issuer)
        : EMPTY_TOKENS,
    [isTokenGroupsSource, rwaMatch],
  )
  const getWhitelistMarketData = useRWAIssuerMarketData(whitelistSiblings)

  const getMarketData = useCallback(
    (token: RWAToken): RWAIssuerMarketData =>
      isTokenGroupsSource
        ? (tokenGroup?.marketDataByToken.get(rwaTokenMarketDataKey(token)) ?? EMPTY_MARKET_DATA)
        : getWhitelistMarketData(token),
    [isTokenGroupsSource, tokenGroup?.marketDataByToken, getWhitelistMarketData],
  )

  return {
    otherIssuerTokens: isTokenGroupsSource ? (tokenGroup?.otherIssuerTokens ?? EMPTY_TOKENS) : whitelistSiblings,
    getMarketData,
  }
}
