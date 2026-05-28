// Copied from https://github.com/Uniswap/interface/blob/main/src/hooks/useENS.ts

import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAddressFromEns, useENSName } from 'uniswap/src/features/ens/api'
import { ENS_SUFFIX } from 'uniswap/src/features/ens/constants'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { useDebounce } from 'utilities/src/time/timing'

type UseENSParams = {
  nameOrAddress?: string | null
  chainId?: UniverseChainId
  autocompleteDomain?: boolean
}

/**
 * Given a name or address, does a lookup to resolve to an address and name
 * @param nameOrAddress ENS name or address
 */
export function useENS({ nameOrAddress, autocompleteDomain = false }: UseENSParams): {
  loading: boolean
  address?: string | null
  name: string | null
} {
  const debouncedNameOrAddress = useDebounce(nameOrAddress) ?? null
  const validAddress = getValidAddress({
    address: debouncedNameOrAddress,
    platform: Platform.EVM,
    log: false,
  })
  const maybeName = validAddress ? null : debouncedNameOrAddress // if it's a valid address then it's not a name

  const { data: name, isLoading: nameFetching } = useENSName(validAddress ?? undefined)
  const { data: address, isLoading: addressFetching } = useAddressFromEns(
    autocompleteDomain ? getCompletedENSName(maybeName) : maybeName,
  )

  return {
    loading: nameFetching || addressFetching,
    address: validAddress ?? address,

    // if nameOrAddress is a name and there's a valid address resolution, it must be a valid ENS
    name: name ?? (address && nameOrAddress) ?? null,
  }
}

export function getCompletedENSName(name: string | null): string | null {
  if (!name) {
    return null
  }

  // If this is the top level uni.eth, we should not query for it as this query will time out.
  // We don't fully understand why this times out but suspect it has to do with the top level ENS record.
  // Other subdomains may have this issue, which is accounted for in usage of the `useENS` hook
  if (name === 'uni') {
    return null
  }

  // Append the .eth if does not already exist
  return name.endsWith(ENS_SUFFIX) ? name : name.concat(ENS_SUFFIX)
}
