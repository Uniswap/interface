// Mirrors the base stub: these modules are web-only; native resolution must also throw.
import type {
  SignInWithPasskeyDeps,
  SignInWithPasskeyHandle,
  SignInWithPasskeyOptions,
} from '@universe/embedded-wallet/src/hooks/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function useSignInWithPasskey(
  _options: SignInWithPasskeyOptions & { deps: SignInWithPasskeyDeps },
): SignInWithPasskeyHandle {
  throw new PlatformSplitStubError('useSignInWithPasskey')
}
