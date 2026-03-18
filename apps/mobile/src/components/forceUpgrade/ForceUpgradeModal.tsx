import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { getIsNotificationServiceLocalOverrideEnabled } from '@universe/notifications'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { SeedPhraseDisplay } from 'src/components/mnemonic/SeedPhraseDisplay'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ForceUpgrade } from 'wallet/src/features/forceUpgrade/ForceUpgrade'

const BACK_BUTTON_SIZE = 24
const BACK_BUTTON_SIZE_TOKEN = '$icon.24'

/**
 * Seed phrase modal content for force upgrade flow.
 * Exported for reuse in notification-driven force upgrade.
 */
export function SeedPhraseModalContent({
  mnemonicId,
  onDismiss,
}: {
  mnemonicId: string
  onDismiss: () => void
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex fill gap="$spacing16" px="$spacing12" py="$spacing24">
      <Flex row alignItems="center" justifyContent="space-between">
        <TouchableArea onPress={onDismiss}>
          <BackButtonView size={BACK_BUTTON_SIZE_TOKEN} />
        </TouchableArea>
        <Text variant="subheading1">{t('forceUpgrade.label.recoveryPhrase')}</Text>
        <Flex width={BACK_BUTTON_SIZE} />
      </Flex>
      <SeedPhraseDisplay mnemonicId={mnemonicId} onDismiss={onDismiss} />
    </Flex>
  )
}

/**
 * Force upgrade modal for the legacy modal system.
 *
 * When the notification service feature flag is enabled, force upgrade is handled
 * by the notification system instead, so this component returns null.
 */
export function ForceUpgradeModal(): JSX.Element | null {
  const isNotificationServiceEnabledFlag = useFeatureFlag(FeatureFlags.NotificationService)
  const isNotificationServiceEnabled =
    getIsNotificationServiceLocalOverrideEnabled() || isNotificationServiceEnabledFlag

  // When notification service is enabled, force upgrade is handled by
  // createForceUpgradeNotificationDataSource instead
  if (isNotificationServiceEnabled) {
    return null
  }

  return <ForceUpgrade SeedPhraseModalContent={SeedPhraseModalContent} />
}
