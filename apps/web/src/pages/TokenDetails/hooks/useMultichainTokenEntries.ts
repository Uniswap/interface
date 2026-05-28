import { useMemo } from 'react'
import {
  type MultichainTokenEntry,
  useOrderedMultichainEntries,
} from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import type { MultiChainMap } from '~/pages/TokenDetails/context/TDPContext'

/** Maps TDP `multiChainMap` to ordered multichain entries (same ordering as balances / address dropdown). */
export function useMultichainTokenEntries(multiChainMap: MultiChainMap): MultichainTokenEntry[] {
  const entries = useMemo(() => {
    const result: MultichainTokenEntry[] = []
    for (const [graphqlChain, data] of Object.entries(multiChainMap)) {
      // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
      if (!data) {
        continue
      }

      const chainId = fromGraphQLChain(graphqlChain)
      if (!chainId) {
        continue
      }

      const rawAddress = data.address
      const isNative = !rawAddress || isNativeCurrencyAddress(chainId, rawAddress)

      result.push({
        chainId,
        address: isNative ? getNativeAddress(chainId) : rawAddress,
        isNative,
      })
    }
    return result
  }, [multiChainMap])
  return useOrderedMultichainEntries(entries)
}
