import type { DeriveArgon2Params } from '@universe/embedded-wallet/src/features/passkey/pinCrypto'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function deriveArgon2(_params: DeriveArgon2Params): Promise<Uint8Array> {
  throw new PlatformSplitStubError('deriveArgon2')
}
