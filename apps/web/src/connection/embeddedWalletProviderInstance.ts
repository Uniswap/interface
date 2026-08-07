import { createEmbeddedWalletProvider } from '@universe/embedded-wallet'
import { viemClients } from 'uniswap/src/features/providers/viemClients'
import { getCapabilitiesCore } from 'wallet/src/features/batchedTransactions/utils'

/**
 * Composition root for the embedded wallet provider. `getCapabilitiesCore` is
 * injected here because it lives in `wallet`, which depends on
 * `@universe/embedded-wallet` — the package cannot import it back.
 */
export const embeddedWalletProvider = createEmbeddedWalletProvider({
  getViemClient: (chainId) => viemClients.getViemClient(chainId),
  getCapabilitiesCore,
})
