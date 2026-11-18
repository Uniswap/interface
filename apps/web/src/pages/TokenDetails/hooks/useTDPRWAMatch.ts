import { useMemo } from 'react'
import type { TokenGroupMember } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useGetTokenGroupQuery'
import { useRwaGroupMatch } from 'uniswap/src/features/rwa/hooks/useRwaGroupMatch'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTDPTokenCategories } from '~/pages/TokenDetails/hooks/useTDPTokenCategories'

/** The page token as a GetTokenGroup member selector; undefined for natives, which have no group. */
export function useTDPRWASubject(): TokenGroupMember | undefined {
  const { currency, currencyChainId } = useTDPStore((s) => ({
    currency: s.currency,
    currencyChainId: s.currencyChainId,
  }))

  return useMemo(
    () => (currency && !currency.isNative ? { chainId: currencyChainId, address: currency.address } : undefined),
    [currency, currencyChainId],
  )
}

function useTDPRWAMatchState(): { rwaMatch: RWAMatch | undefined; isLoading: boolean } {
  const subject = useTDPRWASubject()
  const { categories, isLoading: isCategoriesLoading } = useTDPTokenCategories()
  return useRwaGroupMatch({ subject, categories, isCategoriesLoading })
}

export function useTDPRWAMatch(): RWAMatch | undefined {
  return useTDPRWAMatchState().rwaMatch
}

/** True while the group identity is unresolved, so the header can hold instead of painting the plain token and flipping. */
export function useIsTDPRWAMatchLoading(): boolean {
  return useTDPRWAMatchState().isLoading
}
