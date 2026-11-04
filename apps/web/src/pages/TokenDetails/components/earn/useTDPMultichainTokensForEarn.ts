import { useMemo } from 'react'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import type { TokenProjectTokenForEarn } from 'uniswap/src/features/earn/utils'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

/**
 * Cross-chain deployment rows for the shared earn hooks, derived from the source-agnostic
 * multiChainMap (built from V2 GetTokenMultiChain).
 */
export function useTDPMultichainTokensForEarn(): TokenProjectTokenForEarn[] | undefined {
  const multiChainMap = useTDPStore((s) => s.multiChainMap)

  return useMemo(() => {
    const rows = Object.entries(multiChainMap).flatMap(([chainIdKey, info]) => {
      const chainId = Number(chainIdKey)
      return isUniverseChainId(chainId) ? [{ chainId, address: info.address }] : []
    })
    return rows.length > 0 ? rows : undefined
  }, [multiChainMap])
}
