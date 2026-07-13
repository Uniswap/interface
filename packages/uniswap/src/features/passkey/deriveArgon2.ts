import { PlatformSplitStubError } from 'utilities/src/errors'

export function deriveArgon2(_pin: string, _salt1: Uint8Array): Promise<Uint8Array> {
  throw new PlatformSplitStubError('deriveArgon2')
}
