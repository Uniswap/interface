// Copied from https://github.com/Uniswap/interface/blob/main/src/hooks/useENS.ts

import { ChainId } from 'src/constants/chains'
import { useAddressFromEns, useENSName } from 'src/features/ens/api'
import { getValidAddress } from 'src/utils/addresses'
import { useDebounce } from 'src/utils/timing'

/**
 * Given a name or address, does a lookup to resolve to an address and name
 * @param nameOrAddress ENS name or address
 */
export function useENS(
  chainId: ChainId,
  nameOrAddress?: string | null,
  autocompleteDomain?: boolean
): {
  loading: boolean
  address?: string | null
  name: string | null
} {
  const debouncedNameOrAddress = useDebounce(nameOrAddress) ?? null
  const validAddress = getValidAddress(debouncedNameOrAddress, false, false)
  const maybeName = validAddress ? null : debouncedNameOrAddress // if it's a valid address then it's not a name

  const { data: name, isLoading: nameLoading } = useENSName(validAddress ?? undefined, chainId)
  const { data: address, isLoading: addressLoading } = useAddressFromEns(
    autocompleteDomain ? getCompletedENSName(maybeName) : maybeName,
    chainId
  )

  return {
    loading: nameLoading || addressLoading,
    address: validAddress ?? address,

    // if nameOrAddress is a name and there's a valid address resolution, it must be a valid ENS
    name: name ?? (address && nameOrAddress) ?? null,
  }
}

const getCompletedENSName = (name: string | null): string | null =>
  name?.concat(name ? (!name?.endsWith('.eth') ? '.eth' : '') : '') ?? null
