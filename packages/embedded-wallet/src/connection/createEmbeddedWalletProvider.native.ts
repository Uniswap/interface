// Mirrors the base stub: these modules are web-only; native resolution must also throw.
import type {
  EmbeddedWalletProviderApi,
  EmbeddedWalletProviderDeps,
} from '@universe/embedded-wallet/src/connection/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function createEmbeddedWalletProvider(_deps: EmbeddedWalletProviderDeps): EmbeddedWalletProviderApi {
  throw new PlatformSplitStubError('createEmbeddedWalletProvider')
}
