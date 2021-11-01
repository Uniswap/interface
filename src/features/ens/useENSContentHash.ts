// Copied from https://github.com/Uniswap/interface/blob/main/src/hooks/useENSContentHash.ts

import { utils } from 'ethers'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { useENSRegistrarContract, useENSResolverContract } from 'src/features/contracts/useContract'
import { useSingleCallResult } from 'src/features/multicall'
import { isZero } from 'src/utils/number'

/**
 * Does a lookup for an ENS name to find its contenthash.
 */
export function useENSContentHash(
  chainId: ChainId,
  ensName?: string | null
): {
  loading: boolean
  contenthash: string | null
} {
  const ensNodeArgument = useMemo(() => {
    if (!ensName) return [undefined]
    try {
      return ensName ? [utils.namehash(ensName)] : [undefined]
    } catch (error) {
      return [undefined]
    }
  }, [ensName])
  const registrarContract = useENSRegistrarContract(chainId)
  const resolverAddressResult = useSingleCallResult(
    chainId,
    registrarContract,
    'resolver',
    ensNodeArgument
  )
  const resolverAddress = resolverAddressResult.result?.[0]
  const resolverContract = useENSResolverContract(
    chainId,
    resolverAddress && isZero(resolverAddress) ? undefined : resolverAddress
  )
  const contenthash = useSingleCallResult(chainId, resolverContract, 'contenthash', ensNodeArgument)

  return {
    contenthash: contenthash.result?.[0] ?? null,
    loading: resolverAddressResult.loading || contenthash.loading,
  }
}
