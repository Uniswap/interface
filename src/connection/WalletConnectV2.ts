import { sendAnalyticsEvent } from '@uniswap/analytics'
import { URI_AVAILABLE, WalletConnect, WalletConnectConstructorArgs } from '@web3-react/walletconnect-v2'
import { L1_CHAIN_IDS, L2_CHAIN_IDS, SupportedChainId } from 'constants/chains'
import { Z_INDEX } from 'theme/zIndex'
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
const optionalChains = [...L1_CHAIN_IDS, ...L2_CHAIN_IDS].filter((x) => x !== SupportedChainId.MAINNET)

export class WalletConnectV2 extends WalletConnect {
  ANALYTICS_EVENT = 'Wallet Connect QR Scan'
  constructor({
    actions,
    onError,
    qrcode = true,
  }: Omit<WalletConnectConstructorArgs, 'options'> & { qrcode?: boolean }) {
    const darkmode = Boolean(window.matchMedia('(prefers-color-scheme: dark)'))
    super({
      actions,
      options: {
        projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID as string,
        optionalChains,
        chains: [SupportedChainId.MAINNET],
        showQrModal: qrcode,
        rpcMap: RPC_URLS_WITHOUT_FALLBACKS,
        // as of 6/16/2023 there are no docs for `optionalMethods`
        // this set of optional methods fixes a bug we encountered where permit2 signatures were never received from the connected wallet
        // source: https://uniswapteam.slack.com/archives/C03R5G8T8BH/p1686858618164089?thread_ts=1686778867.145689&cid=C03R5G8T8BH
        optionalMethods: ['eth_signTypedData', 'eth_signTypedData_v4', 'eth_sign'],
        qrModalOptions: {
          chainImages: undefined,
          desktopWallets: undefined,
          enableExplorer: true,
          explorerExcludedWalletIds: undefined,
          explorerRecommendedWalletIds: undefined,
          mobileWallets: undefined,
          privacyPolicyUrl: undefined,
          termsOfServiceUrl: undefined,
          themeMode: darkmode ? 'dark' : 'light',
          themeVariables: {
            '--w3m-font-family': '"Inter custom", sans-serif',
            '--w3m-z-index': Z_INDEX.modal.toString(),
          },
          tokenImages: undefined,
          walletImages: undefined,
        },
      },
      onError,
    })
  }

  activate(chainId?: number) {
    sendAnalyticsEvent(this.ANALYTICS_EVENT)
    return super.activate(chainId)
  }
}

// Custom class for Uniswap Wallet specific functionality
export class UniwalletConnect extends WalletConnectV2 {
  ANALYTICS_EVENT = 'Uniswap Wallet QR Scan'
  static UNI_URI_AVAILABLE = 'uni_uri_available'

  constructor({ actions, onError }: Omit<WalletConnectConstructorArgs, 'options'>) {
    // disables walletconnect's proprietary qr code modal; instead UniwalletModal will listen for events to trigger our custom modal
    super({ actions, qrcode: false, onError })

    this.events.once(URI_AVAILABLE, () => {
      this.provider?.events.on('disconnect', this.deactivate)
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
