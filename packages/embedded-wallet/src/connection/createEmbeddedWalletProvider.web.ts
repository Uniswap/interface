import { EmbeddedWalletProvider } from '@universe/embedded-wallet/src/connection/EmbeddedWalletProvider'
import type {
  EmbeddedWalletProviderApi,
  EmbeddedWalletProviderDeps,
} from '@universe/embedded-wallet/src/connection/types'

export function createEmbeddedWalletProvider(deps: EmbeddedWalletProviderDeps): EmbeddedWalletProviderApi {
  return new EmbeddedWalletProvider(deps)
}
