import { isWebAndroid, isWebIOS } from 'uniswap/src/utils/platform'
import { createConnector } from 'wagmi'
import { walletConnect } from 'wagmi/connectors'

export function uniswapWalletConnect() {
  return createConnector((config) => {
    const wc = walletConnect({
      projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID as string,
      metadata: {
        name: 'Uniswap',
        description: 'Uniswap Interface',
        url: 'https://app.uniswap.org',
        icons: ['https://app.uniswap.org/favicon.png'],
      },
      showQrModal: false,
    })(config)

    config.emitter.on('message', ({ type, data }) => {
      if (type === 'display_uri') {
        // Emits custom wallet connect code, parseable by the Uniswap Wallet
        const uniswapWalletUri = `https://uniswap.org/app/wc?uri=${data}`
        config.emitter.emit('message', { type: 'display_uniswap_uri', data: uniswapWalletUri })

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
