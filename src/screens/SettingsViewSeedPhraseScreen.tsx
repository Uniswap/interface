import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { addScreenshotListener } from 'expo-screen-capture'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { HiddenMnemonicWordView } from 'src/components/mnemonic/HiddenMnemonicWordView'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { Text } from 'src/components/Text'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { useAccounts } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsViewSeedPhrase>

export function SettingsViewSeedPhraseScreen({
  navigation,
  route: {
    params: { address },
  },
}: Props) {
  const { t } = useTranslation()

  const accounts = useAccounts()
  const account = accounts[address]
  const mnemonicId = (account as SignerMnemonicAccount)?.mnemonicId

  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  const [showSeedPhraseViewWarningModal, setShowSeedPhraseViewWarningModal] = useState(true)
  const [showScreenShotWarningModal, setShowScreenShotWarningModal] = useState(false)

  // navigate back when warning modal is not confirmed or closed
  useEffect(() => {
    if (!showSeedPhrase && !showSeedPhraseViewWarningModal) {
      navigation.goBack()
    }
  }, [showSeedPhrase, showSeedPhraseViewWarningModal, navigation])

  const onConfirmWarning = () => {
    if (biometricAuthRequiredForAppAccess || biometricAuthRequiredForTransactions) {
      biometricTrigger()
    } else {
      onShowSeedPhraseConfirmed()
    }
  }

  const onShowSeedPhraseConfirmed = () => {
    setShowSeedPhrase(true)
    setShowSeedPhraseViewWarningModal(false)
  }

  const {
    requiredForAppAccess: biometricAuthRequiredForAppAccess,
    requiredForTransactions: biometricAuthRequiredForTransactions,
  } = useBiometricAppSettings()
  const { trigger: biometricTrigger } = useBiometricPrompt(onShowSeedPhraseConfirmed)

  useEffect(() => {
    const listener = addScreenshotListener(() => setShowScreenShotWarningModal(showSeedPhrase))
    return () => listener?.remove()
  }, [showSeedPhrase])

  return (
    <Screen mx="lg" my="lg">
      <BackHeader alignment="left">
        <Text variant="subhead">{t('Recovery phrase')}</Text>
      </BackHeader>

      {showSeedPhrase ? (
        <Flex grow alignItems="stretch" justifyContent="space-evenly" mt="md">
          <Flex grow mx="md" my="sm">
            <MnemonicDisplay mnemonicId={mnemonicId} />
          </Flex>
          <Flex justifyContent="center">
            <PrimaryButton
              alignSelf="stretch"
              borderRadius="md"
              label={t('Hide recovery phrase')}
              name={ElementName.Next}
              py="md"
              testID={ElementName.Next}
              textVariant="largeLabel"
              variant="gray"
              onPress={() => {
                setShowSeedPhrase(false)
              }}
            />
          </Flex>
        </Flex>
      ) : (
        <HiddenMnemonicWordView />
      )}

      <WarningModal
        caption={t(
          'Please only view your recovery phrase in a private place. Anyone who knows your recovery phrase can access your wallet and funds.'
        )}
        closeText={t('Go back')}
        confirmText={t('View phrase')}
        isVisible={showSeedPhraseViewWarningModal}
        modalName={ModalName.ViewSeedPhraseWarning}
        title={t('Be careful')}
        onClose={() => {
          setShowSeedPhraseViewWarningModal(false)
        }}
        onConfirm={onConfirmWarning}
      />
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
    </Screen>
  )
}
