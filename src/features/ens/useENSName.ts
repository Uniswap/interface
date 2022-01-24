// Copied from https://github.com/Uniswap/interface/blob/main/src/hooks/useENSName.ts

import { utils } from 'ethers'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { useENSRegistrarContract, useENSResolverContract } from 'src/features/contracts/useContract'
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
  const debouncedAddress = useDebounce(address)
  const ensNodeArgument = useMemo(() => {
    if (!isValidAddress(debouncedAddress)) return [undefined]
    try {
      const formattedAddr = trimLeading0x(
        normalizeAddress(debouncedAddress, AddressStringFormat.lowercase)
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
    ensNodeArgument
  )
  const resolverAddressResult = resolverAddress.result?.[0]
  const resolverContract = useENSResolverContract(
    chainId,
    resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined
  )
  const name = useSingleCallResult(chainId, resolverContract, 'name', ensNodeArgument)

  const changed = debouncedAddress !== address
  return {
    ENSName: changed ? null : name.result?.[0] ?? null,
    loading: changed || resolverAddress.loading || name.loading,
  }
}
