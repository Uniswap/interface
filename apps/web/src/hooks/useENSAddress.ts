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
  const debouncedName = useDebounce(ensName, 200)
  const ensNodeArgument = useMemo(() => [debouncedName ? safeNamehash(debouncedName) : undefined], [debouncedName])
  const registrarContract = useENSRegistrarContract()
  const resolverAddressCall = useMainnetSingleCallResult(registrarContract, 'resolver', ensNodeArgument, NEVER_RELOAD)
  const resolverAddress = resolverAddressCall.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddress && !isZero(resolverAddress) ? resolverAddress : undefined
  )
  const addressCall = useMainnetSingleCallResult(resolverContract, 'addr', ensNodeArgument, NEVER_RELOAD)
  const address = addressCall.result?.[0]

  const changed = debouncedName !== ensName
  return useMemo(
    () => ({
      address: changed ? null : address ?? null,
      loading: changed || resolverAddressCall.loading || addressCall.loading,
    }),
    [addressCall.loading, address, changed, resolverAddressCall.loading]
  )
}
