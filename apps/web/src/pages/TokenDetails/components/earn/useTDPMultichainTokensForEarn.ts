import { useMemo } from 'react'
import type { TokenProjectTokenForEarn } from 'uniswap/src/features/earn/utils'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

/**
 * Cross-chain deployment rows for the shared earn hooks, derived from the source-agnostic
 * multiChainMap (V2 GetTokenMultiChain when the flag is on, adapted GraphQL when off).
 */
export function useTDPMultichainTokensForEarn(): TokenProjectTokenForEarn[] | undefined {
  const multiChainMap = useTDPStore((s) => s.multiChainMap)

  return useMemo(() => {
    const rows = Object.entries(multiChainMap).map(([chain, info]) => ({ chain, address: info.address }))
    return rows.length > 0 ? rows : undefined
  }, [multiChainMap])
}
