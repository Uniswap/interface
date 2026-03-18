import { type InAppNotification } from '@universe/api'
import { type NotificationClickTarget } from '@universe/notifications'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ONBOARDING_CONTENT_WIDTH } from 'src/app/features/onboarding/utils'
import { AppRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { getIsOnboardingFromNotification } from 'src/notification-service/data-sources/reactive/storageWarningCondition'
import { spacing } from 'ui/src/theme'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface StorageWarningModalRendererProps {
  notification: InAppNotification
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
  onNotificationShown?: (notificationId: string) => void
}

/**
 * Renderer for the storage warning modal notification.
 *
 * This component preserves the exact UI of the original StorageWarningModal:
 * - High severity warning modal
 * - "Close" button always shown
 * - "View Recovery Phrase" button shown only when NOT in onboarding
 *
 * @see StorageWarningModal for the original implementation
 */
export function StorageWarningModalRenderer({
  notification,
  onNotificationClick,
  onNotificationShown,
}: StorageWarningModalRendererProps): JSX.Element {
  const { t } = useTranslation()
  const { navigateTo } = useExtensionNavigation()
  const isOnboarding = getIsOnboardingFromNotification(notification)

  // Report when the modal is shown
  useEffect(() => {
    onNotificationShown?.(notification.id)
  }, [notification.id, onNotificationShown])

  const handleClose = useCallback((): void => {
    // Report to notification service that user dismissed the modal
    onNotificationClick?.(notification.id, { type: 'dismiss' })
  }, [notification.id, onNotificationClick])

  const handleAcknowledge = useCallback((): void => {
    // Close the modal first
    onNotificationClick?.(notification.id, { type: 'dismiss' })
    // Navigate to recovery phrase settings
    navigateTo(`/${AppRoutes.Settings}/${SettingsRoutes.ViewRecoveryPhrase}`)
  }, [notification.id, onNotificationClick, navigateTo])

  return (
    <WarningModal
      caption={t('extension.warning.storage.message')}
      rejectText={t('common.button.close')}
      acknowledgeText={isOnboarding ? undefined : t('extension.warning.storage.button')}
      isOpen={true}
      maxWidth={isOnboarding ? ONBOARDING_CONTENT_WIDTH - spacing.spacing16 * 2 : undefined}
      modalName={ModalName.StorageWarning}
      severity={WarningSeverity.High}
      title={t('extension.warning.storage.title')}
      onClose={handleClose}
      onAcknowledge={isOnboarding ? undefined : handleAcknowledge}
    />
  )
}
