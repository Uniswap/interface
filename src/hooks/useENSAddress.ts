import { namehash } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useSingleCallResult } from '../state/multicall/hooks'
import { useENSRegistrarContract, useENSResolverContract } from './useContract'
import useDebounce from './useDebounce'

/**
 * Does a lookup for an ENS name to find its address.
 */
export default function useENSAddress(ensName?: string | null): { loading: boolean; address: string | null } {
  const debouncedName = useDebounce(ensName, 200)
  const ensNodeArgument = useMemo(() => {
    if (!debouncedName) return [undefined]
    try {
      return debouncedName ? [namehash(debouncedName)] : [undefined]
    } catch (error) {
      return [undefined]
    }
  }, [debouncedName])
  const registrarContract = useENSRegistrarContract(false)
  const resolverAddress = useSingleCallResult(registrarContract, 'resolver', ensNodeArgument)
  const resolverContract = useENSResolverContract(resolverAddress.result?.[0], false)
  const addr = useSingleCallResult(resolverContract, 'addr', ensNodeArgument)

  const changed = debouncedName !== ensName
  return {
    address: changed ? null : addr.result?.[0] ?? null,
    loading: changed || resolverAddress.loading || addr.loading
  }
}
