import { namehash } from '@ethersproject/hash'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'

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
  const nameCallRes = useSingleCallResult(resolverContract, 'name', ensNodeArgument)
  const name = nameCallRes.result?.[0]

  /* ENS does not enforce that an address owns a .eth domain before setting it as a reverse proxy 
     and recommends that you perform a match on the forward resolution
     see: https://docs.ens.domains/dapp-developer-guide/resolving-names#reverse-resolution
  */
  const fwdAddr = useENSAddress(name)
  const checkedName = address === fwdAddr?.address ? name : null

  const changed = debouncedAddress !== address
  return useMemo(
    () => ({
      ENSName: changed ? null : checkedName,
      loading: changed || resolverAddress.loading || nameCallRes.loading,
    }),
    [changed, nameCallRes.loading, checkedName, resolverAddress.loading]
  )
}
