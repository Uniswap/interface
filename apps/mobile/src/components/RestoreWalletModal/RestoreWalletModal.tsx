import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { DeprecatedButton, Flex, Text, useSporeColors } from 'ui/src'
import { WalletFilled } from 'ui/src/components/icons'
import { iconSizes, opacify } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'

export function RestoreWalletModal(): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()

  const onRestore = (): void => {
    dispatch(closeAllModals())
    navigate(MobileScreens.OnboardingStack, {
      screen: OnboardingScreens.RestoreCloudBackupLoading,
      params: {
        entryPoint: OnboardingEntryPoint.Sidebar,
        importType: ImportType.RestoreMnemonic,
      },
    })
  }

  return (
    <Modal hideHandlebar backgroundColor={colors.surface2.val} isDismissible={false} name={ModalName.RestoreWallet}>
      <Flex centered gap="$spacing16" px="$spacing24" py="$spacing12">
        <Flex
          centered
          borderRadius="$roundedFull"
          p="$spacing12"
          style={{
            backgroundColor: opacify(12, colors.neutral1.val),
          }}
        >
          <WalletFilled color="$neutral1" size={iconSizes.icon24} />
        </Flex>
        <Text textAlign="center" variant="body1">
          {t('account.wallet.button.restore')}
        </Text>
        <Text color="$neutral2" textAlign="center" variant="body2">
          {t('account.wallet.restore.description')}
        </Text>
        <Flex centered row gap="$spacing12" pt="$spacing12">
          <DeprecatedButton fill testID={TestID.RestoreWallet} theme="primary" onPress={onRestore}>
            {t('common.button.restore')}
          </DeprecatedButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
