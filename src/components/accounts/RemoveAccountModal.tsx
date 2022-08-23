import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { ModalName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'

interface RemoveAccountModalProps {
  accountType: AccountType
  onCancel: () => void
  onConfirm: () => void
}

export function RemoveAccountModal({ accountType, onCancel, onConfirm }: RemoveAccountModalProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const { requiredForTransactions: isBiometricAuthEnabled } = useBiometricAppSettings()
  const { trigger: biometricTrigger } = useBiometricPrompt(onConfirm)

  const onPressConfirm = () => {
    if (isBiometricAuthEnabled && accountType !== AccountType.Readonly) {
      biometricTrigger()
    } else {
      onConfirm()
    }
  }

  const getWarningText = () => {
    switch (accountType) {
      case AccountType.Readonly:
        return t('This action will remove this view-only wallet from appearing in your app.')
      case AccountType.SignerMnemonic:
        return t(
          'This action will only remove your wallet from appearing in Uniswap Wallet. Your recovery phrase will remain stored until you delete the app.'
        )
    }
  }

  return (
    <>
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
              {getWarningText()}
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
              onPress={onPressConfirm}
            />
          </Flex>
        </Flex>
      </BottomSheetModal>
    </>
  )
}

const ALERT_ICON_SIZE = 32
