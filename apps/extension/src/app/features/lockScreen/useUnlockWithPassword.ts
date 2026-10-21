import { logger } from 'utilities/src/logger/logger'
import { useSecretMutation, UseSecretMutationResult } from 'utilities/src/security/useSecretMutation'
import { InvalidPasswordError, unlockWallet } from 'wallet/src/features/auth/unlockWallet'

/**
 * Unlock lives in `useSecretMutation`, not a redux saga or `useMutation`, so the password is never an
 * action payload and never a cached mutation argument. Unlocked state itself is read from session
 * storage by `useIsWalletUnlocked`.
 */
export function useUnlockWithPassword(): UseSecretMutationResult<string, void, Error> {
  return useSecretMutation({
    mutationFn: (password: string) => unlockWallet({ password }),
    onError: (error) => {
      if (error instanceof InvalidPasswordError) {
        return
      }
      logger.error(error, { tags: { file: 'useUnlockWithPassword.ts', function: 'useUnlockWithPassword' } })
    },
  })
}
