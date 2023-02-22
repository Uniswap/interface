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
import { APP_STORE_LINK } from 'src/constants/urls'
import { DYNAMIC_CONFIGS } from 'src/features/experiments/constants'
import { UpgradeStatus } from 'src/features/forceUpgrade/types'
import { ModalName } from 'src/features/telemetry/constants'
import { SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { openUri } from 'src/utils/linking'
import { Statsig } from 'statsig-react-native'

export function ForceUpgradeModal(): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const [isVisible, setIsVisible] = useState(false)
  const [upgradeStatus, setUpgradeStatus] = useState(UpgradeStatus.NotRequired)

  // account can be null if the user hasn't added any accounts yet (onboarding)
  const account = useActiveAccount()
  const mnemonicId = account ? (account as SignerMnemonicAccount)?.mnemonicId : undefined

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
    setIsVisible(upgradeStatus !== UpgradeStatus.NotRequired)
  }, [upgradeStatus])

  const onPressConfirm = (): void => {
    openUri(APP_STORE_LINK, /*openExternalBrowser=*/ true, /*isSafeUri=*/ true)
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
          <Text color="textSecondary" textAlign="center" variant="bodySmall">
            {t(
              'The version of Uniswap Wallet you’re using is out of date and is missing critical upgrades. If you don’t update the app or you don’t have your recovery phrase written down, you won’t be able to access your assets.'
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
          hideHandlebar
          backgroundColor={theme.colors.background0}
          name={ModalName.ForceUpgradeModal}>
          <Box flex={1} px="spacing24" py="spacing24">
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
