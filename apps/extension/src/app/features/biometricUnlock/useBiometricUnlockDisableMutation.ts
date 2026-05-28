import { UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query'
import { biometricUnlockCredentialQuery } from 'src/app/features/biometricUnlock/biometricUnlockCredentialQuery'
import { BiometricUnlockStorage } from 'src/app/features/biometricUnlock/BiometricUnlockStorage'
import { logger } from 'utilities/src/logger/logger'

export function useBiometricUnlockDisableMutation(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await BiometricUnlockStorage.remove()
    },
    onSettled: () => {
      // oxlint-disable-next-line typescript/no-floating-promises -- biome-parity: oxlint is stricter here
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
