import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { SeedPhraseDisplay } from 'src/components/mnemonic/SeedPhraseDisplay'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { Text } from 'src/components/Text'
import { config } from 'src/config'
import { useCheckForceUpgradeQuery } from 'src/features/forceUpgrade/forceUpgradeApi'
import { UpgradeStatus } from 'src/features/forceUpgrade/types'
import { ModalName } from 'src/features/telemetry/constants'
import { SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { openUri } from 'src/utils/linking'

export function ForceUpgradeModal() {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const [isVisible, setIsVisible] = useState(false)

  // account can be null if the user hasn't added any accounts yet (onboarding)
  const account = useActiveAccount()
  const mnemonicId = account ? (account as SignerMnemonicAccount)?.mnemonicId : undefined

  const [showSeedPhrase, setShowSeedPhrase] = useState(false)

  const { data: upgradeStatus, isSuccess } = useCheckForceUpgradeQuery()

  useEffect(() => {
    if (isSuccess && upgradeStatus !== UpgradeStatus.NotRequired) {
      setIsVisible(true)
    }
  }, [isSuccess, upgradeStatus])

  const onPressConfirm = () => {
    /**
     * TODO(MOB-2764): Replace with actual app link once available
     * App store link format example: 'itms-apps://apps.apple.com/tr/app/uniswap/id1055437768?l=tr'
     */
    const link = config.uniswapAppUrl
    openUri(link, true)
  }

  const onClose = () => {
    setIsVisible(false)
  }

  const onPressViewRecovery = () => {
    setShowSeedPhrase(true)
  }

  const onDismiss = () => {
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
          <Text color="textSecondary" textAlign="center" variant="bodySmall">
            {t(
              'The version of Uniswap Wallet you’re using is out of date and is missing critical upgrades. If you don’t update the app or you don’t have your recovery phrase written down, you won’t be able to access your assets. '
            )}
            {mnemonicId && (
              <Text color="white" onPress={onPressViewRecovery}>
                {t('View recovery phrase')}
              </Text>
            )}
          </Text>
        </WarningModal>
      )}
      {mnemonicId && showSeedPhrase && (
        <BottomSheetModal
          fullScreen
          backgroundColor={theme.colors.background0}
          hideHandlebar={true}
          name={ModalName.ForceUpgradeModal}>
          <Box flex={1} px="lg" py="lg">
            <Flex row alignItems="center" justifyContent="flex-start">
              <TouchableArea onPress={onDismiss}>
                <BackButtonView size={BACK_BUTTON_SIZE} />
              </TouchableArea>
              <Text variant="subheadLarge">{t('Recovery phrase')}</Text>
              <Box width={BACK_BUTTON_SIZE} />
            </Flex>
            <SeedPhraseDisplay mnemonicId={mnemonicId} onDismiss={onDismiss} />
          </Box>
        </BottomSheetModal>
      )}
    </>
  )
}

const BACK_BUTTON_SIZE = 24
