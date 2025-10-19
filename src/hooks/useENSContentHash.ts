import { useWeb3React } from '@web3-react/core'
import { isTaikoChain } from 'config/chains'
import { NEVER_RELOAD, useMainnetSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { safeNamehash } from 'utils/safeNamehash'

import isZero from '../utils/isZero'
import { useENSRegistrarContract, useENSResolverContract } from './useContract'

/**
 * Does a lookup for an ENS name to find its contenthash.
 */
export default function useENSContentHash(ensName?: string | null): { loading: boolean; contenthash: string | null } {
  const { chainId } = useWeb3React()

  // Skip ENS resolution on Taiko chains (167000, 167012) - Taiko does not support ENS
  const skipENS = chainId && isTaikoChain(chainId)

  const ensNodeArgument = useMemo(
    () => [skipENS ? undefined : ensName ? safeNamehash(ensName) : undefined],
    [skipENS, ensName]
  )
  const registrarContract = useENSRegistrarContract()
  const resolverAddressResult = useMainnetSingleCallResult(registrarContract, 'resolver', ensNodeArgument, NEVER_RELOAD)
  const resolverAddress = resolverAddressResult.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddress && isZero(resolverAddress) ? undefined : resolverAddress
  )
  const contenthash = useMainnetSingleCallResult(resolverContract, 'contenthash', ensNodeArgument, NEVER_RELOAD)

  return useMemo(
    () => ({
      contenthash: skipENS ? null : contenthash.result?.[0] ?? null,
      loading: skipENS ? false : resolverAddressResult.loading || contenthash.loading,
    }),
    [skipENS, contenthash.loading, contenthash.result, resolverAddressResult.loading]
  )
}
