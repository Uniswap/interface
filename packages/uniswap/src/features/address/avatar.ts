import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useENSAvatar } from 'uniswap/src/features/ens/api'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'

/*
 * Fetches avatar for address, in priority uses: unitag avatar, ens avatar, undefined
 *  Note that this hook is used instead of just useENSAvatar because our implementation
 *  of useENSAvatar checks for reverse name resolution which Unitags does not support.
 *  Chose to do this because even if we used useENSAvatar without reverse name resolution,
 *  there is more latency because it has to go to the contract via CCIP-read first.
 */
export function useAvatar(address: string | undefined): {
  avatar: string | undefined
  loading: boolean
} {
  // TODO(WEB-8012): Update to support Solana
  const validated = getValidAddress({ address, platform: Platform.EVM })
  const { data: ensAvatar, isLoading: ensLoading } = useENSAvatar(validated)
  const { data: unitag, isLoading: unitagLoading } = useUnitagsAddressQuery({
    params: validated ? { address: validated } : undefined,
  })

  const unitagAvatar = unitag?.metadata?.avatar

  if (unitagAvatar) {
    return { avatar: unitagAvatar, loading: false }
  }

  if (ensAvatar) {
    return { avatar: ensAvatar, loading: false }
  }

  return { avatar: undefined, loading: ensLoading || unitagLoading }
}
