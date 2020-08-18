import { namehash } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useSingleCallResult } from '../state/multicall/hooks'
import { useENSRegistrarContract, useENSResolverContract } from './useContract'

/**
 * Does a lookup for an ENS name to find its contenthash.
 */
export default function useENSContentHash(ensName?: string | null): { loading: boolean; contenthash: string | null } {
  const ensNodeArgument = useMemo(() => {
    if (!ensName) return [undefined]
    try {
      return ensName ? [namehash(ensName)] : [undefined]
    } catch (error) {
      return [undefined]
    }
  }, [ensName])
  const registrarContract = useENSRegistrarContract(false)
  const resolverAddress = useSingleCallResult(registrarContract, 'resolver', ensNodeArgument)
  const resolverContract = useENSResolverContract(resolverAddress.result?.[0], false)
  const contenthash = useSingleCallResult(resolverContract, 'contenthash', ensNodeArgument)

  return {
    contenthash: contenthash.result?.[0] ?? null,
    loading: resolverAddress.loading || contenthash.loading
  }
}
