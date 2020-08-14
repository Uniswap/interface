import { namehash } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useSingleCallResult } from '../state/multicall/hooks'
import { useENSRegistrarContract, useENSResolverContract } from './useContract'
import useDebounce from './useDebounce'

/**
 * Does a lookup for an ENS name to find its contenthash.
 */
export default function useENSContentHash(ensName?: string | null): { loading: boolean; contenthash: string | null } {
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
  const contenthash = useSingleCallResult(resolverContract, 'contenthash', ensNodeArgument)

  const changed = debouncedName !== ensName
  return {
    contenthash: changed ? null : contenthash.result?.[0] ?? null,
    loading: changed || resolverAddress.loading || contenthash.loading
  }
}
