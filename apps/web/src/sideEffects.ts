import '~/global.css'
import '~/tailwind.css'
import '~/polyfills'
import '~/tracing'
// We intentionally import this to ensure that the WalletConnect provider is bundled as an entrypoint chunk,
// because it will always be requested anyway and we don't want to have a waterfall request pattern.
import * as WalletConnect from '@walletconnect/ethereum-provider'
// note the reason for the setupi18n function is to avoid webpack tree shaking the file out
import { setupi18n } from 'uniswap/src/i18n/i18n-setup-interface'
import { setupWagmiAutoConnect } from '~/components/Web3Provider/wagmiAutoConnect'
import { setupTurnstileCSPErrorFilter } from '~/utils/setupTurnstileCSPErrorFilter'
import { setupVitePreloadErrorHandler } from '~/utils/setupVitePreloadErrorHandler'

// oxlint-disable-next-line typescript/no-unnecessary-condition -- `import *` namespace is always truthy
if (WalletConnect) {
  console.debug('WalletConnect is defined')
}

// adding these so webpack won't tree shake this away, sideEffects was giving trouble
setupi18n()
setupWagmiAutoConnect()
setupVitePreloadErrorHandler()
setupTurnstileCSPErrorFilter()
