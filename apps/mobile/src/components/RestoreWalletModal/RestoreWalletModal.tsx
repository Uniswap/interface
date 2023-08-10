import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { closeModal } from 'src/features/modals/modalSlice'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import LockIcon from 'ui/src/assets/icons/lock.svg'
import { opacify } from 'ui/src/theme/color/utils'

export function RestoreWalletModal(): JSX.Element | null {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const onDismiss = (): void => {
    dispatch(closeModal({ name: ModalName.RestoreWallet }))
  }

  const onRestore = (): void => {
    onDismiss()
    navigate(Screens.OnboardingStack, {
      screen: OnboardingScreens.RestoreCloudBackupLoading,
      params: {
        entryPoint: OnboardingEntryPoint.Sidebar,
        importType: ImportType.Restore,
      },
    })
  }

  return (
    <BottomSheetModal
      backgroundColor={theme.colors.surface2}
      isDismissible={false}
      name={ModalName.RestoreWallet}>
      <Flex centered gap="spacing16" height="100%" mb="spacing24" p="spacing24" paddingTop="none">
        <Flex
          centered
          borderRadius="roundedFull"
          p="spacing12"
          style={{
            backgroundColor: opacify(12, theme.colors.neutral1),
          }}>
          <LockIcon
            color={theme.colors.neutral1}
            height={theme.iconSizes.icon24}
            width={theme.iconSizes.icon24}
          />
        </Flex>
        <Text textAlign="center" variant="bodyLarge">
          {t('Restore wallet')}
        </Text>
        <Text color="neutral2" textAlign="center" variant="bodySmall">
          {t(
            'Because you’re on a new device, you’ll need to restore your recovery phrase. This will allow you to swap and send tokens.'
          )}
        </Text>
        <Flex centered row gap="spacing12" pt="spacing12">
          <Button
            fill
            emphasis={ButtonEmphasis.Tertiary}
            label={t('Dismiss')}
            onPress={onDismiss}
          />
          <Button
            fill
            emphasis={ButtonEmphasis.Primary}
            label="Restore"
            testID={ElementName.RestoreWallet}
            onPress={onRestore}
          />
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
