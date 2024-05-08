import { addScreenshotListener } from 'expo-screen-capture'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePrevious } from 'react-native-wagmi-charts'
import { HiddenMnemonicWordView } from 'src/components/mnemonic/HiddenMnemonicWordView'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { Button, Flex } from 'ui/src'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'

type Props = {
  mnemonicId: string
  onDismiss?: () => void
  walletNeedsRestore?: boolean
}

export function SeedPhraseDisplay({
  mnemonicId,
  onDismiss,
  walletNeedsRestore,
}: Props): JSX.Element {
  const { t } = useTranslation()
  const { isModalOpen: isWalletRestoreModalOpen } = useWalletRestore({ openModalImmediately: true })
  const [showScreenShotWarningModal, setShowScreenShotWarningModal] = useState(false)
  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  const [showSeedPhraseViewWarningModal, setShowSeedPhraseViewWarningModal] = useState(
    !walletNeedsRestore
  )

  const prevIsWalletRestoreModalOpen = usePrevious(isWalletRestoreModalOpen)

  useEffect(() => {
    if (prevIsWalletRestoreModalOpen && !isWalletRestoreModalOpen) {
      onDismiss?.()
    }
  })

  const onShowSeedPhraseConfirmed = (): void => {
    setShowSeedPhrase(true)
    setShowSeedPhraseViewWarningModal(false)
  }

  const onConfirmWarning = async (): Promise<void> => {
    if (biometricAuthRequiredForAppAccess || biometricAuthRequiredForTransactions) {
      await biometricTrigger()
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

  return (
    <>
      <Flex grow mt="$spacing16">
        {showSeedPhrase ? (
          <Flex grow pt="$spacing16" px="$spacing16">
            <MnemonicDisplay mnemonicId={mnemonicId} />
          </Flex>
        ) : (
          <HiddenMnemonicWordView />
        )}
      </Flex>
      <Flex borderTopColor="$surface3" borderTopWidth={1} pt="$spacing12" px="$spacing16">
        <Button
          testID={ElementName.Next}
          theme="secondary"
          onPress={(): void => setShowSeedPhrase(!showSeedPhrase)}>
          {showSeedPhrase
            ? t('setting.recoveryPhrase.action.hide')
            : t('setting.recoveryPhrase.account.show')}
        </Button>
      </Flex>

      {showSeedPhraseViewWarningModal && (
        <WarningModal
          hideHandlebar
          caption={t('setting.recoveryPhrase.warning.view.message')}
          closeText={t('common.button.close')}
          confirmText={t('common.button.view')}
          isDismissible={false}
          modalName={ModalName.ViewSeedPhraseWarning}
          severity={WarningSeverity.High}
          title={t('setting.recoveryPhrase.warning.view.title')}
          onCancel={(): void => {
            setShowSeedPhraseViewWarningModal(false)
            if (!showSeedPhrase) {
              onDismiss?.()
            }
          }}
          onConfirm={onConfirmWarning}
        />
      )}
      {showScreenShotWarningModal && (
        <WarningModal
          caption={t('setting.recoveryPhrase.warning.screenshot.message')}
          confirmText={t('common.button.close')}
          modalName={ModalName.ScreenshotWarning}
          title={t('setting.recoveryPhrase.warning.screenshot.title')}
          onConfirm={(): void => setShowScreenShotWarningModal(false)}
        />
      )}
    </>
  )
}
