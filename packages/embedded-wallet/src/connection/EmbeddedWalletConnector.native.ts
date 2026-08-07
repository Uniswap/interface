// Mirrors the base stub: these modules are web-only; native resolution must also throw.
import type { EmbeddedWalletProviderApi } from '@universe/embedded-wallet/src/connection/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface EmbeddedWalletParameters {
  /** The app-composed provider instance (see web's embeddedWalletProviderInstance). */
  provider: EmbeddedWalletProviderApi
  onConnect?(): void
}

export function embeddedWallet(_parameters: EmbeddedWalletParameters): never {
  throw new PlatformSplitStubError('embeddedWallet')
}
