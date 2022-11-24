import { useActiveWeb3React } from 'hooks'
import { isAddress } from 'utils'

import useENSAddress from './useENSAddress'
import useENSName from './useENSName'

/**
 * Given a name or address, does a lookup to resolve to an address and name
 * @param nameOrAddress ENS name or address
 */
export default function useENS(nameOrAddress?: string | null): {
  loading: boolean
  address: string | null
  name: string | null
} {
  const { chainId, isEVM } = useActiveWeb3React()
  const validated = isAddress(chainId, nameOrAddress)
  const reverseLookup = useENSName(isEVM ? validated || undefined : undefined)
  const lookup = useENSAddress(isEVM ? nameOrAddress : undefined)

  return {
    loading: reverseLookup.loading || lookup.loading,
    address: validated ? validated : lookup.address,
    name: reverseLookup.ENSName ? reverseLookup.ENSName : !validated && lookup.address ? nameOrAddress || null : null,
  }
}
