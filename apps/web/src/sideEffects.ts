import '~/global.css'
import '~/tailwind.css'
import '~/theme/globalStyle.css'
import '~/polyfills'
import '~/tracing'
// We intentionally import this to ensure that the WalletConnect provider is bundled as an entrypoint chunk,
// because it will always be requested anyway and we don't want to have a waterfall request pattern.
import * as WalletConnect from '@walletconnect/ethereum-provider'
// note the reason for the setupi18n function is to avoid webpack tree shaking the file out
import { setupi18n } from 'uniswap/src/i18n/i18n-setup-interface'
import { captureEntryChunkCacheStatus } from '~/app/bootstrap/entryChunkCacheStatus'
import { setupWagmiAutoConnect } from '~/components/Web3Provider/wagmiAutoConnect'
import { registerMetaMaskSolanaWallet } from '~/connection/registerMetaMaskSolana'
import { applyMwebBottomInset } from '~/utils/mwebBottomInset'
import { setupTurnstileCSPErrorFilter } from '~/utils/setupTurnstileCSPErrorFilter'
import { setupVitePreloadErrorHandler } from '~/utils/setupVitePreloadErrorHandler'

// oxlint-disable-next-line typescript/no-unnecessary-condition -- `import *` namespace is always truthy
if (WalletConnect) {
  console.debug('WalletConnect is defined')
}

// adding these so webpack won't tree shake this away, sideEffects was giving trouble
setupi18n()
registerMetaMaskSolanaWallet()
setupWagmiAutoConnect()
// Reads the entry chunk's resource timing before anything can clear it. Safe only while this
// module's evaluation stays one synchronous task: a top-level await anywhere above it would let
// the timing buffer fill and be cleared before this runs.
captureEntryChunkCacheStatus()
setupVitePreloadErrorHandler()
setupTurnstileCSPErrorFilter()
applyMwebBottomInset()
