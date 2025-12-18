import { Z_INDEX } from 'theme/zIndex'
import { isWebAndroid, isWebIOS } from 'utilities/src/platform'
import { createConnector } from 'wagmi'
import { walletConnect } from 'wagmi/connectors'

if (process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID === undefined) {
  throw new Error('REACT_APP_WALLET_CONNECT_PROJECT_ID must be a defined environment variable')
}
const WALLET_CONNECT_PROJECT_ID = <string>process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID

export function walletTypeToAmplitudeWalletType(connectionType?: string): string {
  switch (connectionType) {
    case 'injected': {
      return 'Browser Extension'
    }
    case 'walletConnect': {
      return 'Wallet Connect'
    }
    case 'coinbaseWallet': {
      return 'Coinbase Wallet'
    }
    case 'uniswapWalletConnect': {
      return 'Wallet Connect'
    }
    case 'embeddedUniswapWallet': {
      return 'Passkey'
    }
    default: {
      return connectionType ?? 'Network'
    }
  }
}

export const WC_PARAMS = {
  projectId: WALLET_CONNECT_PROJECT_ID,
  metadata: {
    name: 'Uniswap',
    description: 'Uniswap Interface',
    url: 'https://app.uniswap.org',
    icons: ['https://app.uniswap.org/favicon.png'],
  },
  qrModalOptions: {
    themeVariables: {
      '--wcm-font-family': '"Inter custom", sans-serif',
      '--wcm-z-index': Z_INDEX.overlay.toString(),
    },
  },
}

export function uniswapWalletConnect() {
  return createConnector((config) => {
    const wc = walletConnect({
      ...WC_PARAMS,
      showQrModal: false,
    })(config)

    config.emitter.on('message', ({ type, data }) => {
      if (type === 'display_uri') {
        // Emits custom wallet connect code, parseable by the Uniswap Wallet
        const uniswapWalletUri = `https://uniswap.org/app/wc?uri=${data}`

        // Emits custom event to display the Uniswap Wallet URI
        window.dispatchEvent(new MessageEvent('display_uniswap_uri', { data: uniswapWalletUri }))

        // Opens deeplink to Uniswap Wallet if on mobile
        if (isWebIOS || isWebAndroid) {
          // Using window.location.href to open the deep link ensures smooth navigation and leverages OS handling for installed apps,
          // avoiding potential popup blockers or inconsistent behavior associated with window.open
          window.location.href = `uniswap://wc?uri=${encodeURIComponent(data as string)}`
        }
      }
    })

    return {
      ...wc,
      id: 'uniswapWalletConnect',
      type: 'uniswapWalletConnect',
      name: 'Uniswap Wallet',
      icon: 'https://app.uniswap.org/favicon.png',
    }
  })
}
