import type {
  SignOutWithPasskeyDeps,
  SignOutWithPasskeyHandle,
  SignOutWithPasskeyOptions,
} from '@universe/embedded-wallet/src/hooks/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function useSignOutWithPasskey(
  _options: SignOutWithPasskeyOptions & { deps: SignOutWithPasskeyDeps },
): SignOutWithPasskeyHandle {
  throw new PlatformSplitStubError('useSignOutWithPasskey')
}
