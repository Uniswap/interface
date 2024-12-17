import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { SeedPhraseDisplay } from 'src/components/mnemonic/SeedPhraseDisplay'
import { APP_STORE_LINK } from 'src/constants/urls'
import { UpgradeStatus } from 'src/features/forceUpgrade/types'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { DynamicConfigs, ForceUpgradeConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'
import { SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

export function ForceUpgradeModal(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const forceUpgradeStatusString = useDynamicConfigValue(
    DynamicConfigs.MobileForceUpgrade,
    ForceUpgradeConfigKey.Status,
    '' as string,
  )

  const [isVisible, setIsVisible] = useState(false)
  const [upgradeStatus, setUpgradeStatus] = useState(UpgradeStatus.NotRequired)

  // signerAccounts could be empty if no seed phrase imported or in onboarding
  const signerAccounts = useSignerAccounts()
  const mnemonicId = signerAccounts.length > 0 ? (signerAccounts?.[0] as SignerMnemonicAccount)?.mnemonicId : undefined

  const [showSeedPhrase, setShowSeedPhrase] = useState(false)

  useEffect(() => {
    let status = UpgradeStatus.NotRequired
    if (forceUpgradeStatusString === 'recommended') {
      status = UpgradeStatus.Recommended
    } else if (forceUpgradeStatusString === 'required') {
      status = UpgradeStatus.Required
    }
    setUpgradeStatus(status)
    setIsVisible(status !== UpgradeStatus.NotRequired)
  }, [forceUpgradeStatusString])

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

  // We do not add explicit error boundary here as we can not hide or replace
  // the force upgrade screen on error, hence we fallback to the global error boundary
  return (
    <>
      <WarningModal
        acknowledgeText={t('forceUpgrade.action.confirm')}
        hideHandlebar={upgradeStatus === UpgradeStatus.Required}
        isDismissible={upgradeStatus !== UpgradeStatus.Required}
        isOpen={isVisible}
        modalName={ModalName.ForceUpgradeModal}
        severity={WarningSeverity.High}
        title={t('forceUpgrade.title')}
        onClose={onClose}
        onAcknowledge={onPressConfirm}
      >
        <Text color="$neutral2" textAlign="center" variant="body2">
          {t('forceUpgrade.description')}
        </Text>
        {mnemonicId && (
          <Text color="$accent1" variant="buttonLabel2" onPress={onPressViewRecovery}>
            {t('forceUpgrade.action.recoveryPhrase')}
          </Text>
        )}
      </WarningModal>
      {mnemonicId && showSeedPhrase && (
        <Modal fullScreen backgroundColor={colors.surface1.val} name={ModalName.ForceUpgradeModal} onClose={onDismiss}>
          <Flex fill gap="$spacing16" px="$spacing24" py="$spacing24">
            <Flex row alignItems="center" justifyContent="flex-start">
              <TouchableArea onPress={onDismiss}>
                <BackButtonView size={BACK_BUTTON_SIZE} />
              </TouchableArea>
              <Text variant="subheading1">{t('forceUpgrade.label.recoveryPhrase')}</Text>
              <Flex width={BACK_BUTTON_SIZE} />
            </Flex>
            <SeedPhraseDisplay mnemonicId={mnemonicId} onDismiss={onDismiss} />
          </Flex>
        </Modal>
      )}
    </>
  )
}

const BACK_BUTTON_SIZE = 24
