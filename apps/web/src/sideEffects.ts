/* eslint-disable @typescript-eslint/no-unnecessary-condition */
// note the reason for the setupi18n function is to avoid webpack tree shaking the file out
// biome-ignore assist/source/organizeImports: we want to keep the import order
import { setupi18n } from 'uniswap/src/i18n/i18n-setup-interface'
// biome-ignore assist/source/organizeImports: we want to keep the import order
import '@reach/dialog/styles.css'
import 'global.css'
// biome-ignore assist/source/organizeImports: we want to keep the import order
import 'polyfills'
// biome-ignore assist/source/organizeImports: we want to keep the import order
import 'tracing'

// We intentionally import this to ensure that the WalletConnect provider is bundled as an entrypoint chunk,
// because it will always be requested anyway and we don't want to have a waterfall request pattern.
// eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports
import * as WalletConnect from '@walletconnect/ethereum-provider'
import { setupWagmiAutoConnect } from 'components/Web3Provider/wagmiAutoConnect'
import { setupVitePreloadErrorHandler } from 'utils/setupVitePreloadErrorHandler'

if (WalletConnect) {
  // eslint-disable-next-line no-console
  console.debug('WalletConnect is defined')
}

// adding these so webpack won't tree shake this away, sideEffects was giving trouble
setupi18n()
setupWagmiAutoConnect()
setupVitePreloadErrorHandler()
