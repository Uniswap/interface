import { namehash } from '@ethersproject/hash'
import { NEVER_RELOAD, useEthSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'

import isZero from '../utils/isZero'
import { useENSRegistrarContract, useENSResolverContract } from './useContract'

/**
 * Does a lookup for an ENS name to find its contenthash.
 */
export default function useENSContentHash(ensName?: string | null): { loading: boolean; contenthash: string | null } {
  const ensNodeArgument = useMemo(() => [ensName ? namehash(ensName) : undefined], [ensName])
  const registrarContract = useENSRegistrarContract(false)
  const resolverAddressResult = useEthSingleCallResult(registrarContract, 'resolver', ensNodeArgument, NEVER_RELOAD)
  const resolverAddress = resolverAddressResult.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddress && isZero(resolverAddress) ? undefined : resolverAddress,
    false
  )
  const contenthash = useEthSingleCallResult(resolverContract, 'contenthash', ensNodeArgument, NEVER_RELOAD)

  return useMemo(
    () => ({
      contenthash: contenthash.result?.[0] ?? null,
      loading: resolverAddressResult.loading || contenthash.loading,
    }),
    [contenthash.loading, contenthash.result, resolverAddressResult.loading]
  )
}
