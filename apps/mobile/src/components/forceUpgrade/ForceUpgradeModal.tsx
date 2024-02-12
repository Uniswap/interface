import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { SeedPhraseDisplay } from 'src/components/mnemonic/SeedPhraseDisplay'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { APP_STORE_LINK } from 'src/constants/urls'
import { UpgradeStatus } from 'src/features/forceUpgrade/types'
import { ModalName } from 'src/features/telemetry/constants'
import { openUri } from 'src/utils/linking'
import { Statsig } from 'statsig-react-native'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { DYNAMIC_CONFIGS } from 'wallet/src/features/experiments/constants'
import { SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { useNonPendingSignerAccounts } from 'wallet/src/features/wallet/hooks'

export function ForceUpgradeModal(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const [isVisible, setIsVisible] = useState(false)
  const [upgradeStatus, setUpgradeStatus] = useState(UpgradeStatus.NotRequired)

  // signerAccounts could be empty if no seed phrase imported or in onboarding
  const signerAccounts = useNonPendingSignerAccounts()
  const mnemonicId =
    signerAccounts.length > 0
      ? (signerAccounts?.[0] as SignerMnemonicAccount)?.mnemonicId
      : undefined

  const [showSeedPhrase, setShowSeedPhrase] = useState(false)

  useEffect(() => {
    const config = Statsig.getConfig(DYNAMIC_CONFIGS.ForceUpgrade)
    const statusString = config.getValue('status')?.toString()

    let status = UpgradeStatus.NotRequired
    if (statusString === 'recommended') {
      status = UpgradeStatus.Recommended
    } else if (statusString === 'required') {
      status = UpgradeStatus.Required
    }
    setUpgradeStatus(status)
    setIsVisible(status !== UpgradeStatus.NotRequired)
  }, [])

  const onPressConfirm = async (): Promise<void> => {
    await openUri(APP_STORE_LINK, /*openExternalBrowser=*/ true, /*isSafeUri=*/ true)
  }

  const onClose = (): void => {
    setIsVisible(false)
  }

  const onPressViewRecovery = (): void => {
    setShowSeedPhrase(true)
  }

  const onDismiss = (): void => {
    setShowSeedPhrase(false)
  }

  return (
    <>
      {isVisible && (
        <WarningModal
          confirmText={t('Update app')}
          hideHandlebar={upgradeStatus === UpgradeStatus.Required}
          isDismissible={upgradeStatus !== UpgradeStatus.Required}
          modalName={ModalName.ForceUpgradeModal}
          severity={WarningSeverity.High}
          title={t('Update the app to continue')}
          onClose={onClose}
          onConfirm={onPressConfirm}>
          <Text color="$neutral2" textAlign="center" variant="body2">
            {t(
              'The version of Uniswap Wallet you’re using is out of date and is missing critical upgrades. If you don’t update the app or you don’t have your recovery phrase written down, you won’t be able to access your assets.'
            )}
          </Text>
          {mnemonicId && (
            <Text color="$accent1" variant="buttonLabel3" onPress={onPressViewRecovery}>
              {t('View recovery phrase')}
            </Text>
          )}
        </WarningModal>
      )}
      {mnemonicId && showSeedPhrase && (
        <BottomSheetModal
          fullScreen
          backgroundColor={colors.surface1.get()}
          name={ModalName.ForceUpgradeModal}
          onClose={onDismiss}>
          <Flex fill gap="$spacing16" px="$spacing24" py="$spacing24">
            <Flex row alignItems="center" justifyContent="flex-start">
              <TouchableArea onPress={onDismiss}>
                <BackButtonView size={BACK_BUTTON_SIZE} />
              </TouchableArea>
              <Text variant="subheading1">{t('Recovery phrase')}</Text>
              <Flex width={BACK_BUTTON_SIZE} />
            </Flex>
            <SeedPhraseDisplay mnemonicId={mnemonicId} onDismiss={onDismiss} />
          </Flex>
        </BottomSheetModal>
      )}
    </>
  )
}

const BACK_BUTTON_SIZE = 24
