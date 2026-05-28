import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { ENS_SUFFIX } from 'uniswap/src/features/ens/constants'
import { UNITAG_SUBDOMAIN, UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'

export function extractDomain(
  walletName: string,
  type: OnchainItemListOptionType.Unitag | OnchainItemListOptionType.ENSAddress,
): string {
  const index = walletName.indexOf('.')
  if (index === -1 || index === walletName.length - 1) {
    return type === OnchainItemListOptionType.Unitag ? UNITAG_SUFFIX : ENS_SUFFIX
  }

  const domain = walletName.substring(index)
  return domain === UNITAG_SUBDOMAIN ? UNITAG_SUFFIX : domain
}
