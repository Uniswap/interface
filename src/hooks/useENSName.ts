import { namehash } from '@ethersproject/hash'
import { useMemo } from 'react'

import { useSingleCallResult } from '../state/multicall/hooks'
import { isAddress } from '../utils'
import isZero from '../utils/isZero'
import { useENSRegistrarContract, useENSResolverContract } from './useContract'
import useDebounce from './useDebounce'
import useENSAddress from './useENSAddress'

/**
 * Does a reverse lookup for an address to find its ENS name.
 * Note this is not the same as looking up an ENS name to find an address.
 */
export default function useENSName(address?: string): { ENSName: string | null; loading: boolean } {
  const debouncedAddress = useDebounce(address, 200)
  const ensNodeArgument = useMemo(() => {
    if (!debouncedAddress || !isAddress(debouncedAddress)) return [undefined]
    return [namehash(`${debouncedAddress.toLowerCase().substr(2)}.addr.reverse`)]
  }, [debouncedAddress])
  const registrarContract = useENSRegistrarContract(false)
  const resolverAddress = useSingleCallResult(registrarContract, 'resolver', ensNodeArgument)
  const resolverAddressResult = resolverAddress.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined,
    false
  )
  const name = useSingleCallResult(resolverContract, 'name', ensNodeArgument)
  const nameres = name.result?.[0]
  const fwdAddr = useENSAddress(nameres)
  const checkedName = address !== fwdAddr.address ? nameres : null

  const changed = debouncedAddress !== address
  return useMemo(
    () => ({
      ENSName: changed ? null : checkedName,
      loading: changed || resolverAddress.loading || name.loading,
    }),
    [changed, name.loading, checkedName, resolverAddress.loading]
  )
}
