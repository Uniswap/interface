import { act } from '@testing-library/react'
import {
  INACTIVE_PRIVY_RUNTIME,
  type PrivyRuntimeSnapshot,
  publishPrivyRuntime,
} from '~/features/wallet/privy/privyRuntimeStore'

type PrivyRuntimeOverrides = {
  [Section in keyof PrivyRuntimeSnapshot]?: Partial<PrivyRuntimeSnapshot[Section]>
}

/** Publishes a snapshot the way the PrivyRuntime bridge does, defaulting unset fields to inactive. */
export function publishTestPrivyRuntime(overrides: PrivyRuntimeOverrides = {}): void {
  act(() =>
    publishPrivyRuntime({
      privy: { ...INACTIVE_PRIVY_RUNTIME.privy, ...overrides.privy },
      loginWithOAuth: { ...INACTIVE_PRIVY_RUNTIME.loginWithOAuth, ...overrides.loginWithOAuth },
      loginWithEmail: { ...INACTIVE_PRIVY_RUNTIME.loginWithEmail, ...overrides.loginWithEmail },
      authorizationSignature: {
        ...INACTIVE_PRIVY_RUNTIME.authorizationSignature,
        ...overrides.authorizationSignature,
      },
    }),
  )
}

export function resetPrivyRuntime(): void {
  act(() => publishPrivyRuntime(INACTIVE_PRIVY_RUNTIME))
}
