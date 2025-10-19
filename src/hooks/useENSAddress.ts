import { useWeb3React } from '@web3-react/core'
import { isTaikoChain } from 'config/chains'
import { NEVER_RELOAD, useMainnetSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { safeNamehash } from 'utils/safeNamehash'

import isZero from '../utils/isZero'
import { useENSRegistrarContract, useENSResolverContract } from './useContract'
import useDebounce from './useDebounce'

/**
 * Does a lookup for an ENS name to find its address.
 */
export default function useENSAddress(ensName?: string | null): { loading: boolean; address: string | null } {
  const { chainId } = useWeb3React()
  const debouncedName = useDebounce(ensName, 200)

  // Skip ENS resolution on Taiko chains (167000, 167012) - Taiko does not support ENS
  const skipENS = chainId && isTaikoChain(chainId)

  const ensNodeArgument = useMemo(
    () => [skipENS ? undefined : debouncedName ? safeNamehash(debouncedName) : undefined],
    [skipENS, debouncedName]
  )
  const registrarContract = useENSRegistrarContract()
  const resolverAddress = useMainnetSingleCallResult(registrarContract, 'resolver', ensNodeArgument, NEVER_RELOAD)
  const resolverAddressResult = resolverAddress.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined
  )
  const addr = useMainnetSingleCallResult(resolverContract, 'addr', ensNodeArgument, NEVER_RELOAD)

  const changed = debouncedName !== ensName
  return useMemo(
    () => ({
      address: skipENS || changed ? null : addr.result?.[0] ?? null,
      loading: skipENS ? false : changed || resolverAddress.loading || addr.loading,
    }),
    [skipENS, addr.loading, addr.result, changed, resolverAddress.loading]
  )
}
