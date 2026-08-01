import { isWebPlatform } from '@universe/environment'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

/**
 * Localized "rewards value failed to load" indicator, shown in place of a lifetime-earnings / total
 * rewards value. Informational only (retries happen on the next load): on web it shows a hover
 * tooltip with the error message; on mobile the indicator taps into a "Rewards unavailable" modal.
 */
export function RewardsUnavailableIndicator(): JSX.Element {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const indicator = (
    <Flex row alignItems="center" gap="$spacing4" testID={TestID.RewardsUnavailable}>
      <AlertTriangleFilled color="$neutral3" size="$icon.16" />
      <Text variant="body2" color="$neutral2">
        {t('common.unavailable')}
      </Text>
    </Flex>
  )

  if (isWebPlatform) {
    return (
      <Tooltip placement="top">
        <Tooltip.Trigger>{indicator}</Tooltip.Trigger>
        <Tooltip.Content maxWidth={260}>
          <Text variant="body4" color="$neutral1">
            {t('portfolio.overview.earn.rewards.errorLoading')}
          </Text>
          <Tooltip.Arrow />
        </Tooltip.Content>
      </Tooltip>
    )
  }

  const closeModal = (): void => setIsModalOpen(false)

  return (
    <>
      <TouchableArea onPress={() => setIsModalOpen(true)}>{indicator}</TouchableArea>
      <WarningModal
        isOpen={isModalOpen}
        modalName={ModalName.EarnRewardsUnavailable}
        severity={WarningSeverity.None}
        title={t('portfolio.overview.earn.rewards.unavailableTitle')}
        caption={t('portfolio.overview.earn.rewards.errorLoading')}
        acknowledgeText={t('common.button.close')}
        onAcknowledge={closeModal}
        onClose={closeModal}
      />
    </>
  )
}
