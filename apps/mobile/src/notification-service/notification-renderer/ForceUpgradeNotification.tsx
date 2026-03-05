import type { InAppNotification } from '@universe/api'
import type { NotificationClickTarget } from '@universe/notifications'
import { memo, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SeedPhraseModalContent } from 'src/components/forceUpgrade/ForceUpgradeModal'
import { useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { ForceUpgradeModalContent } from 'wallet/src/features/forceUpgrade/ForceUpgradeModalContent'
import { SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

interface ForceUpgradeNotificationProps {
  notification: InAppNotification
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
  onNotificationShown?: (notificationId: string) => void
}

/**
 * Determines if a notification is a force upgrade notification based on its ID.
 */
export function isForceUpgradeNotification(notification: InAppNotification): boolean {
  return notification.id.startsWith('local:force_upgrade_')
}

/**
 * Determines if the force upgrade is required (blocking) based on the notification ID.
 */
function isRequiredUpgrade(notification: InAppNotification): boolean {
  return notification.id.includes('required')
}

/**
 * Custom force upgrade notification renderer that preserves the legacy UI.
 *
 * This component renders the force upgrade modal with:
 * - Custom image section (Uniswap logo with dot pattern and "New!" tag)
 * - Non-dismissible modal for required upgrades (no background tap dismiss)
 * - Seed phrase backup flow for required upgrades
 *
 * The notification system controls visibility, while this component handles
 * the UI and user interactions, delegating actions back via onNotificationClick.
 */
export const ForceUpgradeNotification = memo(function ForceUpgradeNotification({
  notification,
  onNotificationClick,
  onNotificationShown,
}: ForceUpgradeNotificationProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isRequired = isRequiredUpgrade(notification)

  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  // Track if we've already dismissed to prevent double-dismiss (button click + modal onClose)
  const hasDismissedRef = useRef(false)

  // Get title and subtitle from notification content
  const title = notification.content?.title ?? t('forceUpgrade.title')
  const subtitle = notification.content?.subtitle ?? t('forceUpgrade.description.wallet')

  // Get signer accounts for seed phrase backup
  const signerAccounts = useSignerAccounts()
  const mnemonicId = signerAccounts.length > 0 ? (signerAccounts[0] as SignerMnemonicAccount).mnemonicId : undefined

  // Notify that the notification is shown
  useEffect(() => {
    onNotificationShown?.(notification.id)
  }, [notification.id, onNotificationShown])

  const onClose = useEvent(() => {
    // For recommended upgrades, dismiss the notification (background tap)
    // Skip if already dismissed via button to prevent double-dismiss
    if (!isRequired && !hasDismissedRef.current) {
      hasDismissedRef.current = true
      onNotificationClick?.(notification.id, { type: 'dismiss' })
    }
    // Required upgrades cannot be dismissed via background tap
  })

  const onPressUpdate = useEvent(() => {
    // Click the primary button (index 0) - this triggers the app store navigation
    onNotificationClick?.(notification.id, { type: 'button', index: 0 })
  })

  const onPressBackup = useEvent(() => {
    // Show seed phrase modal instead of navigating away
    setShowSeedPhrase(true)
  })

  const onDismissSeedPhrase = useEvent(() => {
    setShowSeedPhrase(false)
  })

  const onPressNotNow = useEvent(() => {
    hasDismissedRef.current = true
    onNotificationClick?.(notification.id, { type: 'dismiss' })
  })

  return (
    <>
      <Modal
        alignment="top"
        backgroundColor={colors.surface1.val}
        hideHandlebar={isRequired}
        isDismissible={!isRequired}
        isModalOpen={!showSeedPhrase}
        name={ModalName.ForceUpgradeModal}
        onClose={onClose}
      >
        <ForceUpgradeModalContent
          title={title}
          description={subtitle}
          isRequired={isRequired}
          hasMnemonic={!!mnemonicId}
          onPressUpdate={onPressUpdate}
          onPressBackup={onPressBackup}
          onPressNotNow={onPressNotNow}
        />
      </Modal>

      {mnemonicId && showSeedPhrase && (
        <Modal
          fullScreen
          isDismissible
          alignment="top"
          backgroundColor={colors.surface1.val}
          name={ModalName.ForceUpgradeModal}
          onClose={onDismissSeedPhrase}
        >
          <SeedPhraseModalContent mnemonicId={mnemonicId} onDismiss={onDismissSeedPhrase} />
        </Modal>
      )}
    </>
  )
})
