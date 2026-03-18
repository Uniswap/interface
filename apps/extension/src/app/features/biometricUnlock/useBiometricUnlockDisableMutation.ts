import { UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query'
import { BiometricUnlockStorage } from 'src/app/features/biometricUnlock/BiometricUnlockStorage'
import { biometricUnlockCredentialQuery } from 'src/app/features/biometricUnlock/biometricUnlockCredentialQuery'
import { logger } from 'utilities/src/logger/logger'

export function useBiometricUnlockDisableMutation(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await BiometricUnlockStorage.remove()
    },
    onSettled: () => {
      queryClient.invalidateQueries(biometricUnlockCredentialQuery())
    },
    onError: (error) => {
      logger.error(error, {
        tags: {
          file: 'useBiometricUnlockDisableMutation.ts',
          function: 'useBiometricUnlockDisableMutation',
        },
      })
    },
  })
}
