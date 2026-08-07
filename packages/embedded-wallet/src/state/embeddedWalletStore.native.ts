// Mirrors the base stub: these modules are web-only; native resolution must also throw.
import type { EmbeddedWalletState, EmbeddedWalletStateHandle } from '@universe/embedded-wallet/src/state/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function useEmbeddedWalletState(): EmbeddedWalletStateHandle {
  throw new PlatformSplitStubError('useEmbeddedWalletState')
}

export function getEmbeddedWalletState(): EmbeddedWalletState {
  throw new PlatformSplitStubError('getEmbeddedWalletState')
}

export function setChainId(_chainId: number | null): void {
  throw new PlatformSplitStubError('setChainId')
}
