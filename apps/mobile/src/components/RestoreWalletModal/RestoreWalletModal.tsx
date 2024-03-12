import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { closeAllModals, closeModal } from 'src/features/modals/modalSlice'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import LockIcon from 'ui/src/assets/icons/lock.svg'
import { iconSizes, opacify } from 'ui/src/theme'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'

export function RestoreWalletModal(): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useAppDispatch()

  const onDismiss = (): void => {
    dispatch(closeModal({ name: ModalName.RestoreWallet }))
  }

  const onRestore = (): void => {
    dispatch(closeAllModals())
    navigate(Screens.OnboardingStack, {
      screen: OnboardingScreens.RestoreCloudBackupLoading,
      params: {
        entryPoint: OnboardingEntryPoint.Sidebar,
        importType: ImportType.RestoreMnemonic,
      },
    })
  }

  return (
    <BottomSheetModal
      backgroundColor={colors.surface2.get()}
      isDismissible={false}
      name={ModalName.RestoreWallet}>
      <Flex centered gap="$spacing16" px="$spacing24" py="$spacing12">
        <Flex
          centered
          borderRadius="$roundedFull"
          p="$spacing12"
          style={{
            backgroundColor: opacify(12, colors.neutral1.val),
          }}>
          <LockIcon
            color={colors.neutral1.get()}
            height={iconSizes.icon24}
            width={iconSizes.icon24}
          />
        </Flex>
        <Text textAlign="center" variant="body1">
          {t('Restore wallet')}
        </Text>
        <Text color="$neutral2" textAlign="center" variant="body2">
          {t(
            'Because you’re on a new device, you’ll need to restore your recovery phrase. This will allow you to swap and send tokens.'
          )}
        </Text>
        <Flex centered row gap="$spacing12" pt="$spacing12">
          <Button fill theme="tertiary" onPress={onDismiss}>
            {t('Dismiss')}
          </Button>
          <Button fill testID={ElementName.RestoreWallet} theme="primary" onPress={onRestore}>
            {t('Restore')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
