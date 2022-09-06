import React, { PropsWithChildren } from 'react'
import { TFunction } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangleIcon from 'src/assets/icons/alert-triangle.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { WarningSeverity } from 'src/components/warnings/types'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'

type WarningModalProps = {
  isVisible: boolean
  onClose?: () => void
  onConfirm?: () => void
  modalName: ModalName
  title: string
  caption?: string
  closeText?: string
  confirmText?: string
  useBiometric?: boolean
  severity?: WarningSeverity
}

export function captionForAccountRemovalWarning(
  accountType: AccountType,
  t: TFunction<'translation'>
) {
  switch (accountType) {
    case AccountType.Readonly:
      return t('This action will remove this view-only wallet from appearing in your app.')
    case AccountType.SignerMnemonic:
      return t(
        'This action will only remove your wallet from appearing in Uniswap Wallet. Your recovery phrase will remain stored until you delete the app.'
      )
  }
}

export default function WarningModal({
  isVisible,
  onClose,
  onConfirm,
  modalName,
  title,
  caption,
  closeText,
  confirmText,
  severity = WarningSeverity.Medium,
  children,
  useBiometric = false,
}: PropsWithChildren<WarningModalProps>) {
  const { requiredForTransactions } = useBiometricAppSettings()
  const { trigger } = useBiometricPrompt(onConfirm)

  const onPressConfirm = () => {
    if (requiredForTransactions && useBiometric) {
      trigger()
    } else {
      onConfirm?.()
    }
  }

  const theme = useAppTheme()
  return (
    <BottomSheetModal
      backgroundColor={theme.colors.backgroundSurface}
      isVisible={isVisible}
      name={modalName}
      onClose={onClose}>
      <Flex centered gap="md" mb="lg" p="lg">
        <Flex
          centered
          borderColor={severity === WarningSeverity.High ? 'accentFailure' : 'accentWarning'}
          borderRadius="md"
          borderWidth={1}
          p="sm">
          <AlertTriangleIcon
            color={
              severity === WarningSeverity.High
                ? theme.colors.accentFailure
                : theme.colors.accentWarning
            }
            height={24}
            width={24}
          />
        </Flex>
        <Text textAlign="center" variant="mediumLabel">
          {title}
        </Text>
        {caption && (
          <Text color="textSecondary" textAlign="center" variant="bodySmall">
            {caption}
          </Text>
        )}
        {children}
        <Flex centered row gap="sm" pt="lg">
          {closeText && (
            <PrimaryButton
              borderRadius="md"
              flex={1}
              label={closeText}
              variant="transparent"
              onPress={onClose}
            />
          )}
          {confirmText && (
            <PrimaryButton
              borderRadius="md"
              flex={1}
              label={confirmText}
              name={ElementName.Confirm}
              testID={ElementName.Confirm}
              variant={severity === WarningSeverity.High ? 'warningDark' : 'blue'}
              onPress={onPressConfirm}
            />
          )}
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
