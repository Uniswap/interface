import { Provider } from '@web3-react/types'
import METAMASK_ICON from 'assets/wallets/metamask-icon.svg'
import isDataURI from 'utils/isDataUri'

import { EIP6963ProviderDetail } from './types'

const ICON_OVERRIDE_MAP: { [rdns in string]?: string } = {
  'io.metamask': METAMASK_ICON, // MetaMask's provided icon has no padding
}

/** Replaces an announced provider's icon with our preferred image, when applicable */
export function applyOverrideIcon(providerDetail: EIP6963ProviderDetail) {
  const overrideIcon = ICON_OVERRIDE_MAP[providerDetail.info.rdns]
  if (!overrideIcon) return providerDetail

  return { ...providerDetail, info: { ...providerDetail.info, icon: overrideIcon } }
}

function isEip1193Provider(value: any): value is Provider {
  return Boolean(value.request && value.on && value.removeListener)
}

export function isEIP6963ProviderDetail(value: any): value is EIP6963ProviderDetail {
  return Boolean(
    value.provider &&
      isEip1193Provider(value.provider) &&
      value.info &&
      value.info.name &&
      value.info.uuid &&
      value.info.rdns &&
      value.info.icon &&
      isDataURI(value.info.icon)
  )
}

export function isCoinbaseProviderDetail(providerDetail: EIP6963ProviderDetail): boolean {
  return providerDetail.info.rdns === 'com.coinbase.wallet'
}
