// Copied from https://github.com/Uniswap/interface/blob/main/src/hooks/useENS.ts

import { SupportedChainId } from 'src/constants/chains'
import { useENSAddress } from 'src/features/ens/useENSAddress'
import { useENSName } from 'src/features/ens/useENSName'
import { parseAddress } from 'src/utils/addresses'

/**
 * Given a name or address, does a lookup to resolve to an address and name
 * @param nameOrAddress ENS name or address
 */
export function useENS(
  chainId: SupportedChainId,
  nameOrAddress?: string | null
): {
  loading: boolean
  address: string | null
  name: string | null
} {
  const validated = parseAddress(nameOrAddress)
  const reverseLookup = useENSName(chainId, validated ? validated : undefined)
  const lookup = useENSAddress(chainId, nameOrAddress)

  return {
    loading: reverseLookup.loading || lookup.loading,
    address: validated ? validated : lookup.address,
    name: reverseLookup.ENSName
      ? reverseLookup.ENSName
      : !validated && lookup.address
      ? nameOrAddress || null
      : null,
  }
}
