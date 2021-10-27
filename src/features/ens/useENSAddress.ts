// Mostly copied from https://github.com/Uniswap/interface/blob/main/src/hooks/useENSAddress.ts

import { utils } from 'ethers'
import { useMemo } from 'react'
import { SupportedChainId } from 'src/constants/chains'
import { useENSRegistrarContract, useENSResolverContract } from 'src/features/contracts/useContract'
import { useSingleCallResult } from 'src/features/multicall'
import { isZero } from 'src/utils/number'
import { useDebounce } from 'src/utils/timing'

/**
 * Does a lookup for an ENS name to find its address.
 */
export function useENSAddress(
  chainId: SupportedChainId,
  ensName?: string | null
): {
  loading: boolean
  address: string | null
} {
  const debouncedName = useDebounce(ensName, 200)
  const ensNodeArgument = useMemo(() => {
    if (!debouncedName) return [undefined]
    try {
      return debouncedName ? [utils.namehash(debouncedName)] : [undefined]
    } catch (error) {
      return [undefined]
    }
  }, [debouncedName])
  const registrarContract = useENSRegistrarContract(chainId)
  const resolverAddress = useSingleCallResult(
    chainId,
    registrarContract,
    'resolver',
    ensNodeArgument
  )
  const resolverAddressResult = resolverAddress.result?.[0]
  const resolverContract = useENSResolverContract(
    chainId,
    resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined
  )
  const addr = useSingleCallResult(chainId, resolverContract, 'addr', ensNodeArgument)

  const changed = debouncedName !== ensName
  return {
    address: changed ? null : addr.result?.[0] ?? null,
    loading: changed || resolverAddress.loading || addr.loading,
  }
}
