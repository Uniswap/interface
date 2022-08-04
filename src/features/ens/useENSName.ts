// Copied from https://github.com/Uniswap/interface/blob/main/src/hooks/useENSName.ts

import { NEVER_RELOAD } from '@uniswap/redux-multicall'
import { utils } from 'ethers'
import { useEffect, useMemo } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { useENSRegistrarContract, useENSResolverContract } from 'src/features/contracts/useContract'
import { updateName, useCachedEns } from 'src/features/ens/ensSlice'
import { useENSAddress } from 'src/features/ens/useENSAddress'
import { useSingleCallResult } from 'src/features/multicall'
import {
  AddressStringFormat,
  isValidAddress,
  normalizeAddress,
  trimLeading0x,
} from 'src/utils/addresses'
import { isZero } from 'src/utils/number'
import { useDebounce } from 'src/utils/timing'

/**
 * Does a reverse lookup for an address to find its ENS name.
 * Note this is not the same as looking up an ENS name to find an address.
 */
export function useENSName(
  chainId: ChainId,
  address?: string
): { ENSName: string | null; loading: boolean } {
  const dispatch = useAppDispatch()
  // get cached value from store
  const { name: cachedName } = useCachedEns(address)

  const debouncedAddress = useDebounce(address)
  const ensNodeArgument = useMemo(() => {
    if (!isValidAddress(debouncedAddress)) return [undefined]
    try {
      const formattedAddr = trimLeading0x(
        normalizeAddress(debouncedAddress, AddressStringFormat.Lowercase)
      )
      return [utils.namehash(`${formattedAddr}.addr.reverse`)]
    } catch (error) {
      return [undefined]
    }
  }, [debouncedAddress])
  const registrarContract = useENSRegistrarContract(chainId)
  const resolverAddress = useSingleCallResult(
    chainId,
    registrarContract,
    'resolver',
    ensNodeArgument,
    NEVER_RELOAD
  )

  const resolverAddressResult = resolverAddress.result?.[0]
  const resolverContract = useENSResolverContract(
    chainId,
    resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined
  )
  const nameCallRes = useSingleCallResult(
    chainId,
    resolverContract,
    'name',
    ensNodeArgument,
    NEVER_RELOAD
  )
  const name = nameCallRes.result?.[0]

  /* ENS does not enforce that an address owns a .eth domain before setting it as a reverse proxy
     and recommends that you perform a match on the forward resolution
     see: https://docs.ens.domains/dapp-developer-guide/resolving-names#reverse-resolution
  */
  const fwdAddr = useENSAddress(ChainId.Mainnet, name)
  const checkedName = address === fwdAddr?.address ? name : null
  const changed = debouncedAddress !== address

  // Update cache on every new response of checked name.
  useEffect(() => {
    if (address && checkedName) {
      dispatch(updateName({ address, name: checkedName }))
    }
  }, [address, checkedName, dispatch])

  return useMemo(
    () => ({
      ENSName: changed ? cachedName ?? null : checkedName ?? cachedName,
      loading: changed || resolverAddress.loading || nameCallRes.loading,
    }),
    [changed, cachedName, checkedName, resolverAddress.loading, nameCallRes.loading]
  )
}
