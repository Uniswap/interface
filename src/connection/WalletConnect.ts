import { sendAnalyticsEvent } from '@uniswap/analytics'
import { WalletConnect, WalletConnectConstructorArgs } from '@web3-react/walletconnect-v2'

import { RPC_URLS } from '../constants/networks'

// Avoid testing for the best URL by only passing a single URL per chain.
// Otherwise, WC will not initialize until all URLs have been tested (see getBestUrl in web3-react).
const RPC_URLS_WITHOUT_FALLBACKS = Object.entries(RPC_URLS).reduce(
  (map, [chainId, urls]) => ({
    ...map,
    [chainId]: urls[0],
  }),
  {}
)

export class WalletConnectPopup extends WalletConnect {
  ANALYTICS_EVENT = 'Wallet Connect QR Scan'
  constructor({ actions, onError }: Omit<WalletConnectConstructorArgs, 'options'> & { qrcode?: boolean }) {
    super({ actions, onError, options: { rpcUrls: RPC_URLS_WITHOUT_FALLBACKS } })
  }

  activate(chainId?: number) {
    sendAnalyticsEvent(this.ANALYTICS_EVENT)
    return super.activate(chainId)
  }
}
