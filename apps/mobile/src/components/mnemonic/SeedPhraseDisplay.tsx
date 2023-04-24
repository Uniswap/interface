import { useResponsiveProp } from '@shopify/restyle'
import { addScreenshotListener } from 'expo-screen-capture'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout/Flex'
import {
  DEFAULT_MNEMONIC_DISPLAY_HEIGHT,
  FULL_MNEMONIC_DISPLAY_HEIGHT,
} from 'src/components/mnemonic/constants'
import { HiddenMnemonicWordView } from 'src/components/mnemonic/HiddenMnemonicWordView'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { ElementName, ModalName } from 'src/features/telemetry/constants'

type Props = {
  mnemonicId: string
  onDismiss?: () => void
}

export function SeedPhraseDisplay({ mnemonicId, onDismiss }: Props): JSX.Element {
  const { t } = useTranslation()
  const [showScreenShotWarningModal, setShowScreenShotWarningModal] = useState(false)
  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  const [showSeedPhraseViewWarningModal, setShowSeedPhraseViewWarningModal] = useState(true)

  const onShowSeedPhraseConfirmed = (): void => {
    setShowSeedPhrase(true)
    setShowSeedPhraseViewWarningModal(false)
  }

  const onConfirmWarning = (): void => {
    if (biometricAuthRequiredForAppAccess || biometricAuthRequiredForTransactions) {
      biometricTrigger()
    } else {
      onShowSeedPhraseConfirmed()
    }
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

  // when warning modal is not confirmed or closed we need to close this screen
  useEffect(() => {
    if (!showSeedPhrase && !showSeedPhraseViewWarningModal) {
      onDismiss && onDismiss()
    }
  }, [onDismiss, showSeedPhrase, showSeedPhraseViewWarningModal])

  const mnemonicDisplayHeight = useResponsiveProp({
    xs: DEFAULT_MNEMONIC_DISPLAY_HEIGHT,
    sm: FULL_MNEMONIC_DISPLAY_HEIGHT,
  })

  return (
    <>
      {showSeedPhrase ? (
        <Flex grow alignItems="stretch" justifyContent="space-evenly" mt="spacing16">
          <Flex grow mx="spacing16" my="spacing12">
            <MnemonicDisplay
              height={mnemonicDisplayHeight ?? DEFAULT_MNEMONIC_DISPLAY_HEIGHT}
              mnemonicId={mnemonicId}
            />
          </Flex>
          <Flex justifyContent="center">
            <Button
              emphasis={ButtonEmphasis.Secondary}
              label={t('Hide recovery phrase')}
              name={ElementName.Next}
              onPress={(): void => {
                setShowSeedPhrase(false)
              }}
            />
          </Flex>
        </Flex>
      ) : (
        <HiddenMnemonicWordView />
      )}

      {showSeedPhraseViewWarningModal && (
        <WarningModal
          hideHandlebar
          caption={t(
            'Please only view your recovery phrase in a private place. Anyone who knows your recovery phrase can access your wallet and funds.'
          )}
          closeText={t('Go back')}
          confirmText={t('View phrase')}
          isDismissible={false}
          modalName={ModalName.ViewSeedPhraseWarning}
          title={t('Be careful')}
          onClose={(): void => {
            setShowSeedPhraseViewWarningModal(false)
          }}
          onConfirm={onConfirmWarning}
        />
      )}
      {showScreenShotWarningModal && (
        <WarningModal
          caption={t(
            'Anyone who gains access to your photos can access your wallet. We recommend that you write down your words instead.'
          )}
          confirmText={t('OK')}
          modalName={ModalName.ScreenshotWarning}
          title={t('Screenshots aren’t secure')}
          onConfirm={(): void => setShowScreenShotWarningModal(false)}
        />
      )}
    </>
  )
}
