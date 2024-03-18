import { ChainId } from '@uniswap/sdk-core'
import { URI_AVAILABLE, WalletConnect, WalletConnectConstructorArgs } from '@web3-react/walletconnect-v2'
import { sendAnalyticsEvent } from 'analytics'
import { L1_CHAIN_IDS, L2_CHAIN_IDS } from 'constants/chains'
import { APP_RPC_URLS } from 'constants/networks'
import { Z_INDEX } from 'theme/zIndex'
import { isAndroid, isIOS } from 'uniswap/src/utils/platform'

// Avoid testing for the best URL by only passing a single URL per chain.
// Otherwise, WC will not initialize until all URLs have been tested (see getBestUrl in web3-react).
const WC_RPC_URLS = Object.entries(APP_RPC_URLS).reduce(
  (map, [chainId, urls]) => ({
    ...map,
    [chainId]: urls[0],
  }),
  {}
)
export class WalletConnectV2 extends WalletConnect {
  ANALYTICS_EVENT = 'Wallet Connect QR Scan'
  constructor({
    actions,
    defaultChainId,
    qrcode = true,
    onError,
  }: Omit<WalletConnectConstructorArgs, 'options'> & { defaultChainId: number; qrcode?: boolean }) {
    const darkmode = Boolean(window.matchMedia('(prefers-color-scheme: dark)'))
    super({
      actions,
      options: {
        projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID as string,
        chains: [defaultChainId],
        metadata: {
          name: 'Uniswap',
          description: 'Uniswap Interface',
          url: 'https://app.uniswap.org',
          icons: ['https://app.uniswap.org/favicon.png'],
        },
        optionalChains: [...L1_CHAIN_IDS, ...L2_CHAIN_IDS],
        showQrModal: qrcode,
        rpcMap: WC_RPC_URLS,
        // as of 6/16/2023 there are no docs for `optionalMethods`
        // this set of optional methods fixes a bug we encountered where permit2 signatures were never received from the connected wallet
        // source: https://uniswapteam.slack.com/archives/C03R5G8T8BH/p1686858618164089?thread_ts=1686778867.145689&cid=C03R5G8T8BH
        optionalMethods: ['eth_signTypedData', 'eth_signTypedData_v4', 'eth_sign'],
        qrModalOptions: {
          desktopWallets: undefined,
          enableExplorer: true,
          explorerExcludedWalletIds: undefined,
          explorerRecommendedWalletIds: undefined,
          mobileWallets: undefined,
          privacyPolicyUrl: undefined,
          termsOfServiceUrl: undefined,
          themeMode: darkmode ? 'dark' : 'light',
          themeVariables: {
            '--wcm-font-family': '"Inter custom", sans-serif',
            '--wcm-z-index': Z_INDEX.modal.toString(),
          },
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
    super({ actions, defaultChainId: ChainId.MAINNET, qrcode: false, onError })

    this.events.once(URI_AVAILABLE, () => {
      this.provider?.events.on('disconnect', this.deactivate)
    })

    this.events.on(URI_AVAILABLE, (uri) => {
      if (!uri) return

      // Emits custom wallet connect code, parseable by the Uniswap Wallet
      this.events.emit(UniwalletConnect.UNI_URI_AVAILABLE, `https://uniswap.org/app/wc?uri=${uri}`)

      // Opens deeplink to Uniswap Wallet if on iOS
      if (isIOS || isAndroid) {
        // Using window.location.href to open the deep link ensures smooth navigation and leverages OS handling for installed apps,
        // avoiding potential popup blockers or inconsistent behavior associated with window.open
        window.location.href = `uniswap://wc?uri=${encodeURIComponent(uri)}`
      }
    })
  }

  deactivate() {
    this.events.emit(URI_AVAILABLE)
    return super.deactivate()
  }
}
