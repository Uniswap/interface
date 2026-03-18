import { useFocusEffect } from '@react-navigation/core'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsStackNavigationProp } from 'src/app/navigation/types'
import { NotificationsBackgroundImage } from 'src/components/notifications/NotificationsBGImage'
import {
  NotificationPermission,
  useNotificationOSPermissionsEnabled,
} from 'src/features/notifications/hooks/useNotificationOSPermissionsEnabled'
import { usePromptPushPermission } from 'src/features/notifications/hooks/usePromptPushPermission'
import { openNotificationSettings } from 'src/utils/linking'
import { Button, Flex } from 'ui/src'
import { BellOn } from 'ui/src/components/icons/BellOn'
import { GenericHeader } from 'uniswap/src/components/misc/GenericHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

type NotificationsOSSettingsModalProps = {
  navigation: SettingsStackNavigationProp
}

/**
 * This modal is used to inform the user that they need to enable notifications in the
 * OS settings for the app
 */
export function NotificationsOSSettingsModal({ navigation }: NotificationsOSSettingsModalProps): JSX.Element {
  const { notificationPermissionsEnabled, checkNotificationPermissions } = useNotificationOSPermissionsEnabled()
  const promptPushPermission = usePromptPushPermission()
  const { t } = useTranslation()

  const shouldNavigateToSettings = useMemo(() => {
    return notificationPermissionsEnabled === NotificationPermission.Enabled
  }, [notificationPermissionsEnabled])

  const navigateToSettings = useCallback(() => {
    navigation.navigate(MobileScreens.SettingsStack, {
      screen: MobileScreens.SettingsNotifications,
    })
  }, [navigation])

  useFocusEffect(
    useCallback(() => {
      if (shouldNavigateToSettings) {
        navigation.goBack()
      }
    }, [shouldNavigateToSettings, navigation]),
  )

  const onPressEnableNotifications = useCallback(async () => {
    const arePushNotificationsEnabled = await promptPushPermission()
    if (!arePushNotificationsEnabled) {
      await openNotificationSettings()
    } else {
      await checkNotificationPermissions()
    }
  }, [checkNotificationPermissions, promptPushPermission])

  const onClose = useCallback(() => {
    if (shouldNavigateToSettings) {
      navigateToSettings()
    } else {
      navigation.goBack()
    }
  }, [navigation, shouldNavigateToSettings, navigateToSettings])

  return (
    <Modal name={ModalName.NotificationsOSSettings} isModalOpen={true} onClose={onClose}>
      <Flex animation="fast" gap="$spacing40" pb="$spacing12" px="$spacing24" width="100%">
        <GenericHeader
          Icon={BellOn}
          flexProps={{ m: '$spacing12' }}
          subtitle={t('onboarding.notification.subtitle')}
          title={t('onboarding.notification.title')}
        />
        <Flex gap="$spacing40" justifyContent="space-between">
          <NotificationsBackgroundImage />

          <Trace logPress element={ElementName.Enable}>
            <Flex row>
              <Button variant="branded" testID="turn-on-notifications" onPress={onPressEnableNotifications}>
                {t('settings.action.enableInSettings')}
              </Button>
            </Flex>
          </Trace>
        </Flex>
      </Flex>
    </Modal>
  )
}
