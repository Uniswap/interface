import { TokenRankingsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG } from '@universe/api'
import { useMemo } from 'react'
import { useTokenRankingsQuery } from 'uniswap/src/data/rest/tokenRankings'
import {
  buildFavoritesCanonicalLookup,
  FavoritesCanonicalLookup,
} from 'uniswap/src/features/favorites/canonicalFavoritesLookup'

type UseMultichainFavoritesRankingsResult = FavoritesCanonicalLookup & {
  tokenRankingsData: TokenRankingsResponse | undefined
}

/**
 * Shared source of truth for favorite-token canonicalization and multichain badge visibility.
 *
 * Fetches TokenRankings with `{ chainId: ALL_NETWORKS_ARG, multichain: true }`, regardless of the
 * Explore chain filter. Tanstack Query dedupes by key, so multiple consumers (FavoriteTokensGrid,
 * useToggleFavoriteCallback, the migration) share one network request.
 *
 * Returns empty maps when data hasn't arrived yet. Callers should fall back gracefully: keep the
 * input currencyId as-is, and show the chain badge.
 */
export function useMultichainFavoritesRankings(): UseMultichainFavoritesRankingsResult {
  const { data } = useTokenRankingsQuery({ chainId: ALL_NETWORKS_ARG, multichain: true })

  return useMemo(() => {
    const lookup = buildFavoritesCanonicalLookup(data)
    return { ...lookup, tokenRankingsData: data }
  }, [data])
}
