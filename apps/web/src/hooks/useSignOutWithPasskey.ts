import { usePrivy } from '@privy-io/react-auth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { disconnectWallet } from 'uniswap/src/features/passkey/embeddedWallet'
import { logger } from 'utilities/src/logger/logger'
import { resetListAuthenticators } from '~/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { useIsEmbeddedWallet } from '~/hooks/useIsEmbeddedWallet'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'

interface SignOutWithPasskeyOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Hook that provides functionality to sign out from an embedded wallet using passkey.
 * Upon successful sign-out:
 * - Disconnects the underlying wallet connection
 * - Updates the embedded wallet state by setting isConnected to false
 *
 * @param {Object} options - Configuration options for the sign-out process
 * @param {() => void} [options.onSuccess] - Optional callback function to execute after successful sign-out
 * @param {(error: Error) => void} [options.onError] - Optional callback function to handle any errors during sign-out
 * @returns Mutation object with signOutWithPasskey function and mutation states
 */
export function useSignOutWithPasskey({ onSuccess, onError }: SignOutWithPasskeyOptions = {}) {
  const { walletId, setIsConnected } = useEmbeddedWalletState()
  const queryClient = useQueryClient()
  const { logout, ready } = usePrivy()
  const connectedWithEmbeddedWallet = useIsEmbeddedWallet()

  const { mutate: signOutWithPasskey, ...rest } = useMutation({
    mutationFn: async () => {
      await disconnectWallet(walletId ?? undefined)
      if (connectedWithEmbeddedWallet && ready) {
        await logout().catch((err) => {
          logger.warn('useSignOutWithPasskey', 'Privy logout failed after disconnectWallet', err)
        })
      }
      return true
    },
    onSuccess: () => {
      setIsConnected(false)
      // Drop cached authenticators (and their sessionStorage mirror) so the next user
      // who signs in on this device gets a fresh listAuthenticators fetch.
      resetListAuthenticators(queryClient, walletId)
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
