// Mirrors the base stub: these modules are web-only; native resolution must also throw.
import type {
  CompleteEmbeddedWalletLoginDeps,
  CompleteEmbeddedWalletLoginInput,
} from '@universe/embedded-wallet/src/hooks/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function useOnCompleteEmbeddedWalletLogin(
  _deps: CompleteEmbeddedWalletLoginDeps,
): (input: CompleteEmbeddedWalletLoginInput) => Promise<void> {
  throw new PlatformSplitStubError('useOnCompleteEmbeddedWalletLogin')
}
