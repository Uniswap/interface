import { Button, Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { NumberType } from 'utilities/src/format/types'
import { LockPreviewImage } from 'wallet/src/components/backup/LockPreviewImage'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

interface BackupReminderContentProps {
  description: string
  layout: 'extension' | 'mobile'
  onPressBackup: () => void
  onPressMaybeLater: () => void
}

export function BackupReminderContent({
  description,
  layout,
  onPressBackup,
  onPressMaybeLater,
}: BackupReminderContentProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const activeAddress = useActiveAccountAddress()
  const { data: portfolioData } = usePortfolioTotalValue({
    evmAddress: activeAddress ?? undefined,
  })

  const unprotectedFunds = portfolioData?.balanceUSD ?? 0
  const formattedUnprotectedFunds = convertFiatAmountFormatted(unprotectedFunds, NumberType.FiatTokenQuantity)
  const isExtension = layout === 'extension'

  const title = (
    <Text
      color={isExtension ? '$neutral1' : undefined}
      textAlign={isExtension ? 'center' : undefined}
      variant={isExtension ? 'subheading2' : 'subheading1'}
    >
      {t('onboarding.backup.reminder.title')}
    </Text>
  )
  const descriptionText = (
    <Text color="$neutral2" textAlign="center" variant="body3">
      {description}
    </Text>
  )
  const fundsAtRisk = (
    <Flex row width={isExtension ? undefined : '100%'} justifyContent="space-between" py="$spacing16" px="$spacing4">
      <Text color="$neutral2" textAlign={isExtension ? undefined : 'center'} variant="body3">
        {t('onboarding.backup.reminder.warning.fundsLabel')}
      </Text>
      <Flex row alignItems="center" gap="$spacing4" px={isExtension ? undefined : '$spacing4'}>
        <WarningIcon severity={WarningSeverity.Medium} strokeColorOverride="$statusCritical" size="$icon.18" />
        <Text color="$statusCritical" textAlign={isExtension ? undefined : 'center'} variant="body3">
          {formattedUnprotectedFunds}
        </Text>
      </Flex>
    </Flex>
  )
  const backupButton = (
    <Flex row>
      <Trace logPress element={ElementName.Continue} modal={ModalName.BackupReminder}>
        <Button
          variant={isExtension ? 'branded' : 'default'}
          size="medium"
          flexGrow={isExtension ? undefined : 1}
          onPress={onPressBackup}
        >
          {t('onboarding.backup.reminder.backupNowButton')}
        </Button>
      </Trace>
    </Flex>
  )
  const remindLaterButton = (
    <Flex row pt={isExtension ? undefined : '$spacing8'}>
      <Trace logPress element={ElementName.MaybeLaterButton} modal={ModalName.BackupReminder}>
        <Button emphasis="text-only" size="medium" flexGrow={isExtension ? undefined : 1} onPress={onPressMaybeLater}>
          <Text color="$neutral2" variant="buttonLabel2">
            {t('onboarding.backup.reminder.remindMeLaterButton')}
          </Text>
        </Button>
      </Trace>
    </Flex>
  )

  return (
    <Flex
      grow={isExtension ? undefined : true}
      gap={isExtension ? '$spacing8' : '$spacing24'}
      pb={isExtension ? undefined : '$spacing16'}
      pt={isExtension ? '$spacing16' : undefined}
      px={isExtension ? undefined : '$spacing24'}
    >
      <LockPreviewImage />
      {isExtension ? (
        <>
          <Flex alignItems="center" gap="$spacing8" pt="$spacing8" px="$spacing4">
            {title}
            {descriptionText}
          </Flex>
          {fundsAtRisk}
          <Flex gap="$spacing8">
            {backupButton}
            {remindLaterButton}
          </Flex>
        </>
      ) : (
        <Flex alignItems="center" gap="$spacing4" px="$spacing4">
          {title}
          {descriptionText}
          {fundsAtRisk}
          {backupButton}
          {remindLaterButton}
        </Flex>
      )}
    </Flex>
  )
}
