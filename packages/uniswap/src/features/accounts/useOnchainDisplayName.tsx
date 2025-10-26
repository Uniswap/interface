import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { DisplayName, DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useENSName } from 'uniswap/src/features/ens/api'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { getValidAddress, sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { trimToLength } from 'utilities/src/primitives/string'

const ENS_TRIM_LENGTH = 8

export type WalletDisplayNameOptions = OnchainDisplayNameOptions & {
  showLocalName?: boolean
}

export type OnchainDisplayNameOptions = {
  showShortenedEns?: boolean
  includeUnitagSuffix?: boolean
  overrideDisplayName?: string
}

/**
 * Displays the ENS name or Unitag name if one is available, otherwise displays the address.
 *
 * @param address - The address to display
 * @param options.showShortenedEns - Whether to shorten the ENS name to ENS_TRIM_LENGTH characters
 * @param options.includeUnitagSuffix - Whether to include the unitag suffix (.uni.eth) in returned unitag name
 */
export function useOnchainDisplayName(
  address: Maybe<string>,
  options?: OnchainDisplayNameOptions,
): DisplayName | undefined {
  const defaultOptions = {
    showShortenedEns: false,
    includeUnitagSuffix: false,
  }
  const hookOptions = { ...defaultOptions, ...options }
  const { showShortenedEns, includeUnitagSuffix, overrideDisplayName } = hookOptions

  // TODO(WEB-8012): Update to support Solana
  const validated = getValidAddress({ address, platform: Platform.EVM })
  const ens = useENSName(validated ?? undefined)
  const { data: unitag } = useUnitagsAddressQuery({
    params: validated ? { address: validated } : undefined,
  })

  if (!address) {
    return undefined
  }

  if (overrideDisplayName) {
    return {
      name: showShortenedEns ? trimToLength(overrideDisplayName, ENS_TRIM_LENGTH) : overrideDisplayName,
      type: DisplayNameType.ENS,
    }
  }

  if (unitag?.username) {
    return {
      name: includeUnitagSuffix ? unitag.username + UNITAG_SUFFIX : unitag.username,
      type: DisplayNameType.Unitag,
    }
  }

  if (ens.data) {
    return {
      name: showShortenedEns ? trimToLength(ens.data, ENS_TRIM_LENGTH) : ens.data,
      type: DisplayNameType.ENS,
    }
  }

  return {
    name: `${sanitizeAddressText(shortenAddress({ address }))}`,
    type: DisplayNameType.Address,
  }
}
