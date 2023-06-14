import { sendAnalyticsEvent } from '@uniswap/analytics'
import { WalletConnect, WalletConnectConstructorArgs } from '@web3-react/walletconnect'

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
  constructor({
    actions,
    onError,
    qrcode = true,
  }: Omit<WalletConnectConstructorArgs, 'options'> & { qrcode?: boolean }) {
    super({ actions, options: { qrcode, rpc: RPC_URLS_WITHOUT_FALLBACKS }, onError })
  }

  activate(chainId?: number) {
    sendAnalyticsEvent(this.ANALYTICS_EVENT)
    return super.activate(chainId)
  }
}
