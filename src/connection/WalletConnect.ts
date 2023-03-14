import { sendAnalyticsEvent } from '@uniswap/analytics'
import { URI_AVAILABLE, WalletConnect, WalletConnectConstructorArgs } from '@web3-react/walletconnect'
import { isIOS } from 'utils/userAgent'

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

// Custom class for Uniswap Wallet specific functionality
export class UniwalletConnect extends WalletConnectPopup {
  ANALYTICS_EVENT = 'Uniswap Wallet QR Scan'
  static UNI_URI_AVAILABLE = 'uni_uri_available'

  constructor({ actions, onError }: Omit<WalletConnectConstructorArgs, 'options'>) {
    // disables walletconnect's proprietary qr code modal; instead UniwalletModal will listen for events to trigger our custom modal
    super({ actions, qrcode: false, onError })

    this.events.once(URI_AVAILABLE, () => {
      this.provider?.connector.on('disconnect', () => {
        this.deactivate()
      })
    })

    this.events.on(URI_AVAILABLE, (uri) => {
      if (!uri) return
      // Emits custom wallet connect code, parseable by the Uniswap Wallet
      this.events.emit(UniwalletConnect.UNI_URI_AVAILABLE, `hello_uniwallet:${uri}`)

      // Opens deeplink to Uniswap Wallet if on iOS
      if (isIOS) {
        const newTab = window.open(`https://uniswap.org/app/wc?uri=${encodeURIComponent(uri)}`)

        // Fixes blank tab opening on mobile Chrome
        newTab?.close()
      }
    })
  }

  deactivate() {
    this.events.emit(URI_AVAILABLE)
    return super.deactivate()
  }
}
