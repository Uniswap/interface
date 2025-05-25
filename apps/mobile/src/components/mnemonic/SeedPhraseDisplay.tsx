import { useFocusEffect, useNavigation } from '@react-navigation/core'
import { addScreenshotListener } from 'expo-screen-capture'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { WalletRestoreType } from 'src/components/RestoreWalletModal/RestoreWalletModalState'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { useWalletRestore } from 'src/features/wallet/useWalletRestore'
import { Button, Flex } from 'ui/src'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

type Props = {
  mnemonicId: string
  onDismiss?: () => void
  walletNeedsRestore?: boolean
}

export function SeedPhraseDisplay({ mnemonicId, onDismiss, walletNeedsRestore }: Props): JSX.Element {
  const { t } = useTranslation()
  const { walletRestoreType } = useWalletRestore({
    openModalImmediately: true,
  })
  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  const navigation = useNavigation()
  const [showSeedPhraseViewWarningModal, setShowSeedPhraseViewWarningModal] = useState(!walletNeedsRestore)

  useFocusEffect(
    useCallback(() => {
      if (walletRestoreType !== WalletRestoreType.None) {
        navigation.goBack()

        // This is a very unlikely edge case if the user somehow get to this screen on a new device.
        // In this case, we want to back an additional time to dismiss the NewDevice modal which is
        // will try to reopen anytime this screen is focused.
        if (walletRestoreType === WalletRestoreType.NewDevice) {
          navigation.goBack()
        }
      }
    }, [walletRestoreType, navigation]),
  )

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
    const listener = addScreenshotListener(() =>
      navigate(ModalName.ScreenshotWarning, { acknowledgeText: t('common.button.close') }),
    )
    return () => listener?.remove()
  }, [showSeedPhrase, t])

  return (
    <>
      <Flex grow mt="$spacing16">
        <Flex grow pt="$spacing16" px="$spacing16">
          <MnemonicDisplay mnemonicId={mnemonicId} showMnemonic={showSeedPhrase} />
        </Flex>
      </Flex>
      <Flex row borderTopColor="$surface3" borderTopWidth={1} pt="$spacing12" px="$spacing16">
        <Button
          size="large"
          emphasis="secondary"
          testID={TestID.Next}
          onPress={(): void => setShowSeedPhrase(!showSeedPhrase)}
        >
          {showSeedPhrase ? t('setting.recoveryPhrase.action.hide') : t('setting.recoveryPhrase.account.show')}
        </Button>
      </Flex>

      {showSeedPhraseViewWarningModal && (
        <WarningModal
          hideHandlebar
          caption={t('setting.recoveryPhrase.warning.view.message')}
          rejectText={t('common.button.close')}
          acknowledgeText={t('common.button.view')}
          isDismissible={false}
          isOpen={showSeedPhraseViewWarningModal}
          modalName={ModalName.ViewSeedPhraseWarning}
          severity={WarningSeverity.High}
          title={t('setting.recoveryPhrase.warning.view.title')}
          onReject={(): void => {
            setShowSeedPhraseViewWarningModal(false)
            if (!showSeedPhrase) {
              onDismiss?.()
            }
          }}
          onAcknowledge={onConfirmWarning}
        />
      )}
    </>
  )
}
