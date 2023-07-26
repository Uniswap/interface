import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { closeModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import LockIcon from 'ui/src/assets/icons/lock.svg'
import { opacify } from 'ui/src/theme/color/utils'

export function RestoreWalletModal(): JSX.Element | null {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const onClose = useCallback((): void => {
    dispatch(closeModal({ name: ModalName.RestoreWallet }))
  }, [dispatch])

  return (
    <BottomSheetModal
      backgroundColor={theme.colors.background1}
      name={ModalName.RestoreWallet}
      onClose={onClose}>
      <Flex centered gap="spacing16" height="100%" mb="spacing24" p="spacing24" paddingTop="none">
        <Flex
          centered
          borderRadius="roundedFull"
          p="spacing12"
          style={{
            backgroundColor: opacify(12, theme.colors.textPrimary),
          }}>
          <LockIcon
            color={theme.colors.textPrimary}
            height={theme.iconSizes.icon24}
            width={theme.iconSizes.icon24}
          />
        </Flex>
        <Text textAlign="center" variant="bodyLarge">
          {t('Restore wallet')}
        </Text>
        <Text color="textSecondary" textAlign="center" variant="bodySmall">
          {t(
            'Because you’re on a new device, you’ll need to restore your recovery phrase. This will allow you to swap and send tokens.'
          )}
        </Text>
        <Flex centered row gap="spacing12" pt="spacing12">
          <Button
            fill
            emphasis={ButtonEmphasis.Tertiary}
            label={t('Maybe later')}
            onPress={onClose}
          />
          <Button
            fill
            emphasis={ButtonEmphasis.Primary}
            label="Restore"
            testID={ElementName.RestoreWallet}
          />
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
