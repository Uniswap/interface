import { namehash } from '@ethersproject/hash'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'

import isZero from '../utils/isZero'
import { useENSRegistrarContract, useENSResolverContract } from './useContract'

/**
 * Does a lookup for an ENS name to find its contenthash.
 */
export default function useENSContentHash(ensName?: string | null): { loading: boolean; contenthash: string | null } {
  const ensNodeArgument = useMemo(() => [ensName ? namehash(ensName) : undefined], [ensName])
  const registrarContract = useENSRegistrarContract(false)
  const resolverAddressResult = useSingleCallResult(registrarContract, 'resolver', ensNodeArgument)
  const resolverAddress = resolverAddressResult.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddress && isZero(resolverAddress) ? undefined : resolverAddress,
    false
  )
  const contenthash = useSingleCallResult(resolverContract, 'contenthash', ensNodeArgument)

  return useMemo(
    () => ({
      contenthash: contenthash.result?.[0] ?? null,
      loading: resolverAddressResult.loading || contenthash.loading,
    }),
    [contenthash.loading, contenthash.result, resolverAddressResult.loading]
  )
}
