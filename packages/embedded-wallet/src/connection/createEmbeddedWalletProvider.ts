import type {
  EmbeddedWalletProviderApi,
  EmbeddedWalletProviderDeps,
} from '@universe/embedded-wallet/src/connection/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function createEmbeddedWalletProvider(_deps: EmbeddedWalletProviderDeps): EmbeddedWalletProviderApi {
  throw new PlatformSplitStubError('createEmbeddedWalletProvider')
}
