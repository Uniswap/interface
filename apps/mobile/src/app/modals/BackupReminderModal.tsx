import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { LockPreviewImage } from 'src/features/onboarding/LockPreviewImage'
import { Button, Flex, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { NumberType } from 'utilities/src/format/types'
import { setBackupReminderLastSeenTs } from 'wallet/src/features/behaviorHistory/slice'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

export function BackupReminderModal(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const closedByButtonRef = useRef<boolean>(false)
  const { onClose } = useReactNavigationModal()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const activeAddress = useActiveAccountAddress()
  const { data: portfolioData } = usePortfolioTotalValue({
    evmAddress: activeAddress ?? undefined,
  })

  const checkForSwipeToDismiss = (): void => {
    onClose()
    if (!closedByButtonRef.current) {
      // Modal was swiped to dismiss, should open the BackupReminderWarning modal
      navigate(ModalName.BackupReminderWarning)
    }

    // Reset the ref and close the modal
    closedByButtonRef.current = false
  }

  const onPressMaybeLater = (): void => {
    closedByButtonRef.current = true
    dispatch(setBackupReminderLastSeenTs(Date.now()))
    onClose()
    navigate(ModalName.BackupReminderWarning)
  }

  const onPressBackup = (): void => {
    closedByButtonRef.current = true
    dispatch(setBackupReminderLastSeenTs(Date.now()))
    onClose()
    navigate(MobileScreens.OnboardingStack, {
      screen: OnboardingScreens.Backup,
      params: { importType: ImportType.BackupOnly, entryPoint: OnboardingEntryPoint.BackupCard },
    })
  }

  const unprotectedFunds = portfolioData?.balanceUSD ?? 0
  const formattedUnprotectedFunds = convertFiatAmountFormatted(unprotectedFunds, NumberType.FiatTokenQuantity)

  return (
    <Modal
      isModalOpen
      name={ModalName.BackupReminder}
      hideHandlebar={true}
      isDismissible={false}
      onClose={checkForSwipeToDismiss}
    >
      <Flex grow gap="$spacing24" pb="$spacing16" px="$spacing24">
        <LockPreviewImage />
        <Flex alignItems="center" gap="$spacing4" px="$spacing4">
          <Text variant="subheading1">{t('onboarding.backup.reminder.title')}</Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('onboarding.backup.reminder.warning.description')}
          </Text>
          <Flex row width="100%" justifyContent="space-between" py="$spacing16" px="$spacing4">
            <Text color="$neutral2" textAlign="center" variant="body3">
              {t('onboarding.backup.reminder.warning.fundsLabel')}
            </Text>
            <Flex row alignItems="center" gap="$spacing4" px="$spacing4">
              <WarningIcon severity={WarningSeverity.Medium} strokeColorOverride="$statusCritical" size="$icon.18" />
              <Text color="$statusCritical" textAlign="center" variant="body3">
                {formattedUnprotectedFunds}
              </Text>
            </Flex>
          </Flex>
          <Flex row>
            <Trace logPress element={ElementName.Continue} modal={ModalName.BackupReminder}>
              <Button variant="default" size="medium" flexGrow={1} onPress={onPressBackup}>
                {t('onboarding.backup.reminder.backupNowButton')}
              </Button>
            </Trace>
          </Flex>
          <Flex row pt="$spacing8">
            <Trace logPress element={ElementName.MaybeLaterButton} modal={ModalName.BackupReminder}>
              <Button emphasis="text-only" size="medium" flexGrow={1} onPress={onPressMaybeLater}>
                <Text variant="buttonLabel2" color="$neutral2">
                  {t('onboarding.backup.reminder.remindMeLaterButton')}
                </Text>
              </Button>
            </Trace>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}
