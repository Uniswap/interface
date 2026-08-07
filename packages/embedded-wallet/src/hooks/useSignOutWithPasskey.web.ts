import { useMutation } from '@tanstack/react-query'
import { disconnectWallet } from '@universe/embedded-wallet/src/features/passkey/embeddedWallet'
import type {
  SignOutWithPasskeyDeps,
  SignOutWithPasskeyHandle,
  SignOutWithPasskeyOptions,
} from '@universe/embedded-wallet/src/hooks/types'
import { useEmbeddedWalletState } from '@universe/embedded-wallet/src/state/embeddedWalletStore'
import { logger } from 'utilities/src/logger/logger'

/**
 * Signs out from an embedded wallet: disconnects the wallet session, logs out of
 * Privy when active, and flips the store's isConnected off.
 */
export function useSignOutWithPasskey({
  onSuccess,
  onError,
  deps,
}: SignOutWithPasskeyOptions & { deps: SignOutWithPasskeyDeps }): SignOutWithPasskeyHandle {
  const { walletId, setIsConnected } = useEmbeddedWalletState()

  const { mutate: signOutWithPasskey, ...rest } = useMutation({
    mutationFn: async () => {
      await disconnectWallet(walletId ?? undefined)
      if (deps.isEmbeddedWalletActive && deps.privy.ready) {
        await deps.privy.logout().catch((err) => {
          logger.warn('useSignOutWithPasskey', 'Privy logout failed after disconnectWallet', err)
        })
      }
      return true
    },
    onSuccess: () => {
      setIsConnected(false)
      deps.onSignedOut(walletId)
      onSuccess?.()
    },
    onError: (error: Error) => {
      logger.error(error, {
        tags: {
          file: 'useSignOutWithPasskey',
          function: 'signOutWithPasskey',
        },
      })
      onError?.(error)
    },
  })

  return { signOutWithPasskey, ...rest }
}
