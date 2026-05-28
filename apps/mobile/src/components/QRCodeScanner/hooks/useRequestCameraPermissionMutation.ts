import { UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, PermissionResponse, PermissionStatus } from 'expo-camera'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { cameraPermissionQuery } from 'src/components/QRCodeScanner/hooks/useCameraPermissionQuery'
import { usePreventLock } from 'src/features/lockScreen/hooks/usePreventLock'
import { openSettings } from 'src/utils/linking'
import { logger } from 'utilities/src/logger/logger'

const ERROR_PERMISSION_STATUSES = [PermissionStatus.UNDETERMINED, PermissionStatus.DENIED]

export const useRequestCameraPermissionMutation = (): UseMutationResult<PermissionResponse, Error, void> => {
  const { t } = useTranslation()
  const { preventLock } = usePreventLock()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // NB: we use preventLock to prevent accidental lock screen when requesting permission
      // this happens on android when requesting any permissions :(
      return await preventLock(Camera.requestCameraPermissionsAsync)
    },

    onError: (error) => {
      logger.error(error, {
        tags: { file: 'useRequestCameraPermissionMutation.ts', function: 'useRequestCameraPermissionMutation' },
      })
    },

    onSuccess: (data) => {
      if (ERROR_PERMISSION_STATUSES.includes(data.status)) {
        Alert.alert(t('qrScanner.error.camera.title'), t('qrScanner.error.camera.message'), [
          { text: t('common.navigation.systemSettings'), onPress: openSettings },
          { text: t('common.button.notNow') },
        ])
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries(cameraPermissionQuery)
    },
  })
}
