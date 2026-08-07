import { useQueryClient } from '@tanstack/react-query'
import {
  type SignOutWithPasskeyOptions,
  useSignOutWithPasskey as useSignOutWithPasskeyCore,
} from '@universe/embedded-wallet'
import { useEvent } from 'utilities/src/react/hooks'
import { resetListAuthenticators } from '~/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { useIsEmbeddedWallet } from '~/hooks/useIsEmbeddedWallet'
import { useMaybePrivy } from '~/hooks/useMaybePrivy'

/**
 * Web wiring for the shared passkey sign-out flow: Privy session, active-wallet
 * check, and authenticator cache cleanup. The flow itself lives in
 * `@universe/embedded-wallet`.
 */
export function useSignOutWithPasskey(options: SignOutWithPasskeyOptions = {}) {
  const queryClient = useQueryClient()
  const { logout, ready } = useMaybePrivy()
  const isEmbeddedWalletActive = useIsEmbeddedWallet()

  return useSignOutWithPasskeyCore({
    ...options,
    deps: {
      privy: { logout, ready },
      isEmbeddedWalletActive,
      // Drop cached authenticators (and their sessionStorage mirror) so the next user
      // who signs in on this device gets a fresh listAuthenticators fetch.
      onSignedOut: useEvent((walletId: string | null) => resetListAuthenticators(queryClient, walletId)),
    },
  })
}
