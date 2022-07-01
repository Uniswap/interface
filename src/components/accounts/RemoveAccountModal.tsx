import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'

interface RemoveAccountModalProps {
  onCancel: () => void
  onConfirm: () => void
}

export function RemoveAccountModal({ onCancel, onConfirm }: RemoveAccountModalProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  return (
    <BottomSheetModal
      backgroundColor={theme.colors.backgroundSurface}
      isVisible={true}
      name={ModalName.RemoveWallet}
      onClose={onCancel}>
      <Flex centered gap="xl" px="md" py="lg">
        <Flex centered gap="xs">
          <AlertTriangle
            color={theme.colors.accentWarning}
            height={ALERT_ICON_SIZE}
            width={ALERT_ICON_SIZE}
          />
          <Text mt="xs" variant="mediumLabel">
            {t('Are you sure?')}
          </Text>
          <Text color="textSecondary" textAlign="center" variant="bodySmall">
            {t(
              'You’ll only be able to recover this wallet if you have backed it up. Removing your wallet will not permanently delete it or its contents.'
            )}
          </Text>
        </Flex>
        <Flex row mb="md">
          <PrimaryButton
            borderColor="backgroundOutline"
            borderWidth={1}
            flex={1}
            label={t('Cancel')}
            style={{ backgroundColor: theme.colors.backgroundSurface }}
            textColor="textPrimary"
            onPress={onCancel}
          />
          <PrimaryButton
            flex={1}
            label={t('Remove')}
            style={{ backgroundColor: theme.colors.accentFailureSoft }}
            textColor="accentFailure"
            onPress={onConfirm}
          />
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

const ALERT_ICON_SIZE = 32
