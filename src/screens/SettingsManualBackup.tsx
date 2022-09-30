import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { addScreenshotListener } from 'expo-screen-capture'
import React, { useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SlideInRight, SlideOutLeft } from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { SettingsStackParamList } from 'src/app/navigation/types'
import PencilIcon from 'src/assets/icons/pencil.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { ManualBackupEducationSection } from 'src/components/mnemonic/ManualBackupEducationSection'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import { MnemonicTest } from 'src/components/mnemonic/MnemonicTest'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { Text } from 'src/components/Text'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { BackupType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsManualBackup>

enum BackupViewStep {
  Education,
  ViewSeedPhrase,
  SeedPhraseTest,
}

export function SettingsManualBackup({
  navigation,
  route: {
    params: { address },
  },
}: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const accounts = useAccounts()
  const account = accounts[address]
  const mnemonicId = (account as SignerMnemonicAccount)?.mnemonicId
  const hasManualBackup = account.backups?.includes(BackupType.Manual)

  const [showScreenShotWarningModal, setShowScreenShotWarningModal] = useState(false)

  const [currentStep, nextStep] = useReducer(
    (step: BackupViewStep) => step + 1,
    BackupViewStep.Education
  )

  const view = () => {
    switch (currentStep) {
      case BackupViewStep.Education:
        return <ManualBackupEducationView />
      case BackupViewStep.ViewSeedPhrase:
        return <ViewSeedPhraseView />
      case BackupViewStep.SeedPhraseTest:
        return <SeedPhraseTestView />
      default:
        return null
    }
  }

  useEffect(() => {
    if (currentStep === BackupViewStep.Education) return

    const listener = addScreenshotListener(() => setShowScreenShotWarningModal(true))
    return () => listener?.remove()
  }, [currentStep])

  return (
    <Screen>
      <BackHeader alignment="left" mx="md" pt="md">
        <Text variant="subhead">{t('Manual backup')}</Text>
      </BackHeader>
      <Flex mx="lg" my="lg">
        {view()}
      </Flex>
    </Screen>
  )

  function ManualBackupEducationView() {
    return (
      <AnimatedFlex
        grow
        alignItems="stretch"
        exiting={SlideOutLeft}
        gap="lg"
        justifyContent="space-evenly">
        {hasManualBackup ? (
          <Text variant="bodySmall">
            {t(
              'Before backing up your recovery phrase again, make sure that you keep the following steps in mind:'
            )}
          </Text>
        ) : (
          <Text color="accentWarning" variant="bodySmall">
            {t(
              'It looks like you haven’t backed up your recovery phrase manually yet. Before doing so, make sure that you keep the following steps in mind:'
            )}
          </Text>
        )}

        <Flex grow gap="lg" justifyContent="flex-start">
          <ManualBackupEducationSection />
        </Flex>
        <Flex justifyContent="flex-end">
          <PrimaryButton
            alignSelf="stretch"
            borderRadius="lg"
            icon={<PencilIcon color={theme.colors.white} height={24} width={24} />}
            label={t('Back up manually')}
            name={ElementName.AddManualBackup}
            py="md"
            textVariant="largeLabel"
            variant="blue"
            onPress={nextStep}
          />
        </Flex>
      </AnimatedFlex>
    )
  }

  function ViewSeedPhraseView() {
    return (
      <>
        <AnimatedFlex
          grow
          alignItems="stretch"
          entering={SlideInRight}
          exiting={SlideOutLeft}
          gap="none"
          justifyContent="space-evenly">
          <Text variant="bodySmall">
            {t('Remember to record your words in the same order as they are below')}
          </Text>
          <Flex grow justifyContent="flex-start" mx="sm" my="xl">
            <MnemonicDisplay mnemonicId={mnemonicId} />
          </Flex>
          <Flex justifyContent="center">
            <PrimaryButton
              alignSelf="stretch"
              borderRadius="md"
              label={t('Continue')}
              name={ElementName.Continue}
              testID={ElementName.Continue}
              textVariant="largeLabel"
              variant="blue"
              onPress={nextStep}
            />
          </Flex>
        </AnimatedFlex>
        <WarningModal
          caption={t(
            'Storing your recovery phrase as a screenshot is easy, but it allows anyone with access to your device access to your wallet. We encourage you to delete the screenshot and write down your recovery phrase instead.'
          )}
          confirmText={t('OK')}
          isVisible={showScreenShotWarningModal}
          modalName={ModalName.ScreenshotWarning}
          title={t('Screenshots aren’t secure')}
          onConfirm={() => setShowScreenShotWarningModal(false)}
        />
      </>
    )
  }

  function SeedPhraseTestView() {
    const [continueEnabled, setContinueEnabled] = useState(false)

    return (
      <>
        <AnimatedFlex
          grow
          alignItems="stretch"
          entering={SlideInRight}
          exiting={SlideOutLeft}
          justifyContent="space-evenly">
          <Text variant="bodySmall">
            {t(
              'Confirm that you correctly wrote down your recovery phrase by selecting the missing words.'
            )}
          </Text>
          <Flex>
            <MnemonicTest mnemonicId={mnemonicId} onTestComplete={() => setContinueEnabled(true)} />
          </Flex>
          <Flex grow justifyContent="flex-end">
            <PrimaryButton
              alignSelf="stretch"
              borderRadius="md"
              disabled={!continueEnabled}
              label={t('Continue')}
              name={ElementName.Continue}
              testID={ElementName.Continue}
              textVariant="largeLabel"
              variant="blue"
              onPress={() => {
                dispatch(
                  editAccountActions.trigger({
                    type: EditAccountAction.AddBackupMethod,
                    address: address,
                    backupMethod: BackupType.Manual,
                  })
                )
                navigation.goBack()
              }}
            />
          </Flex>
        </AnimatedFlex>
      </>
    )
  }
}
