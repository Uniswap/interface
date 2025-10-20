import { useQuery } from '@tanstack/react-query/build/modern/useQuery'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { RecoveryPhraseVerification } from 'src/app/features/recoveryPhraseVerification/RecoveryPhraseVerification'
import { BackupWarningBulletPoints } from 'src/app/features/settings/BackupRecoveryPhrase/BackupWarningBulletPoints'
import { NUMBER_OF_TESTS_FOR_RECOVERY_PHRASE_VERIFICATION } from 'src/app/features/settings/BackupRecoveryPhrase/constants'
import { EnterPasswordModal } from 'src/app/features/settings/password/EnterPasswordModal'
import { SeedPhraseDisplay } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/SeedPhraseDisplay'
import { SettingsRecoveryPhrase } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/SettingsRecoveryPhrase'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Checkbox, Flex, SpinningLoader, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled, FileListCheck, FileListLock } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { hasBackup } from 'wallet/src/features/wallet/accounts/utils'
import { useActiveAccountWithThrow, useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { mnemonicUnlockedQuery } from 'wallet/src/features/wallet/Keyring/queries'

enum ViewStep {
  Warning = 0,
  Password = 1,
  Reveal = 2,
  Confirm = 3,
}

export function BackupRecoveryPhraseScreen(): JSX.Element {
  return (
    <Flex grow backgroundColor="$surface1">
      <ScreenHeader />

      <BackupRecoveryPhraseScreenSteps />
    </Flex>
  )
}

function BackupRecoveryPhraseScreenSteps(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const activeAccount = useActiveAccountWithThrow()

  const { navigateBack } = useExtensionNavigation()

  const [viewStep, setViewStep] = useState(ViewStep.Warning)

  const mnemonicId = useSignerAccounts()[0]?.mnemonicId

  if (!mnemonicId) {
    throw new Error('Invalid render of `ViewRecoveryPhraseScreen` without `mnemonicId`')
  }

  const showPasswordModal = useCallback((): void => {
    setViewStep(ViewStep.Password)
  }, [])

  const { value: isDisclaimerChecked, toggle: toggleDisclaimer } = useBooleanState(false)

  const hasMaybeManualBackup = hasBackup(BackupType.MaybeManual, activeAccount)

  const onBackupComplete = useEvent(() => {
    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.AddBackupMethod,
        address: activeAccount.address,
        backupMethod: BackupType.Manual,
      }),
    )

    if (hasMaybeManualBackup) {
      // Remove `maybe-manual` backup type when completing manual backup.
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.RemoveBackupMethod,
          address: activeAccount.address,
          backupMethod: BackupType.MaybeManual,
        }),
      )
    }

    navigateBack()
  })

  switch (viewStep) {
    case ViewStep.Warning:
    case ViewStep.Password:
      return (
        <SettingsRecoveryPhrase
          icon={<AlertTriangleFilled color="$statusCritical" size="$icon.24" />}
          nextButtonEnabled={true}
          nextButtonText={t('common.button.continue')}
          nextButtonEmphasis="primary"
          subtitle={t('onboarding.backup.view.subtitle.message1')}
          title={t('onboarding.backup.manual.displayWarning.title')}
          onNextPressed={showPasswordModal}
        >
          <EnterPasswordModal
            isOpen={viewStep === ViewStep.Password}
            onClose={() => setViewStep(ViewStep.Warning)}
            onNext={() => setViewStep(ViewStep.Reveal)}
          />

          <Flex my="$spacing24">
            <BackupWarningBulletPoints />
          </Flex>
        </SettingsRecoveryPhrase>
      )
    case ViewStep.Reveal:
      return (
        <SettingsRecoveryPhrase
          icon={<FileListCheck size="$icon.24" color="$neutral1" />}
          iconBackgroundColor="$surface3"
          nextButtonEnabled={isDisclaimerChecked}
          nextButtonText={t('common.button.continue')}
          nextButtonEmphasis="primary"
          subtitle={t('onboarding.backup.view.subtitle.message2')}
          title={t('onboarding.backup.view.title')}
          titleColor="$neutral1"
          onNextPressed={() => setViewStep(ViewStep.Confirm)}
        >
          <Flex fill gap="$spacing24" pt="$spacing24">
            <SeedPhraseDisplay mnemonicId={mnemonicId} />

            <TouchableArea onPress={toggleDisclaimer}>
              <Flex gap="$spacing12" row backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12">
                <Checkbox checked={isDisclaimerChecked} />

                <Text color="$neutral2" variant="body3">
                  {t('onboarding.backup.speedBump.manual.disclaimer')}
                </Text>
              </Flex>
            </TouchableArea>
          </Flex>
        </SettingsRecoveryPhrase>
      )
    case ViewStep.Confirm:
      return <RecoveryPhraseVerificationStep mnemonicId={mnemonicId} onComplete={onBackupComplete} />
  }
}

function RecoveryPhraseVerificationStep({
  mnemonicId,
  onComplete,
}: {
  mnemonicId: string
  onComplete: () => void
}): JSX.Element {
  const { t } = useTranslation()

  const [subtitle, setSubtitle] = useState('')
  const [hasError, setHasError] = useState(false)
  const [numberOfWordsVerified, setNumberOfWordsVerified] = useState(0)

  const { data: mnemonic, error } = useQuery(mnemonicUnlockedQuery(mnemonicId))

  if (error) {
    // This should never happen. We can't recover from a missing mnemonic.
    const missingMnemonicError = new Error('Missing mnemonic in `RecoveryPhraseVerificationStep`: ' + mnemonicId)
    missingMnemonicError.cause = error
    throw missingMnemonicError
  }

  const mnemonicArray = useMemo(() => (mnemonic ? mnemonic.split(' ') : null), [mnemonic])

  return (
    <SettingsRecoveryPhrase
      icon={<FileListLock size="$icon.24" color="$neutral1" />}
      iconBackgroundColor="$surface3"
      nextButtonEnabled={false}
      nextButtonText={t('onboarding.backup.manual.progress', {
        completedStepsCount: numberOfWordsVerified,
        totalStepsCount: NUMBER_OF_TESTS_FOR_RECOVERY_PHRASE_VERIFICATION,
      })}
      nextButtonEmphasis="primary"
      subtitle={subtitle}
      title={t('onboarding.backup.manual.title')}
      titleColor="$neutral1"
      onNextPressed={() => {}}
    >
      <Flex gap="$spacing24" mb="$spacing24" width="100%">
        {!mnemonicArray ? (
          <Flex fill justifyContent="center" alignItems="center" mt="$spacing48">
            <SpinningLoader size={iconSizes.icon48} />
          </Flex>
        ) : (
          <>
            <RecoveryPhraseVerification
              mnemonic={mnemonicArray}
              onComplete={onComplete}
              numberOfTests={NUMBER_OF_TESTS_FOR_RECOVERY_PHRASE_VERIFICATION}
              onWordVerified={(numberOfWordsVerified) => setNumberOfWordsVerified(numberOfWordsVerified)}
              setSubtitle={setSubtitle}
              setHasError={setHasError}
            />

            <Text color="$statusCritical" style={{ opacity: hasError ? 1 : 0 }} textAlign="center" variant="body3">
              {t('onboarding.backup.manual.error')}
            </Text>
          </>
        )}
      </Flex>
    </SettingsRecoveryPhrase>
  )
}
