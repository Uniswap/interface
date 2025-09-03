import { usePasskeyAuthWithHelpModal } from 'hooks/usePasskeyAuthWithHelpModal'
import { useEmbeddedWalletState } from 'state/embeddedWallet/store'
import { disconnectWallet } from 'uniswap/src/features/passkey/embeddedWallet'
import { logger } from 'utilities/src/logger/logger'

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
  const { setIsConnected } = useEmbeddedWalletState()

  const { mutate: signOutWithPasskey, ...rest } = usePasskeyAuthWithHelpModal(
    async () => {
      await disconnectWallet()
      return true
    },
    {
      onSuccess: () => {
        setIsConnected(false)
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
    },
  )

  return { signOutWithPasskey, ...rest }
}
