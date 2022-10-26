import React, { PropsWithChildren } from 'react'
import { TFunction } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangleIcon from 'src/assets/icons/alert-triangle.svg'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { WarningColor, WarningSeverity } from 'src/components/modals/WarningModal/types'
import { Text } from 'src/components/Text'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'

export type WarningModalProps = {
  isVisible: boolean
  onClose?: () => void
  onCancel?: () => void
  onConfirm?: () => void
  modalName: ModalName
  title: string
  caption?: string
  closeText?: string
  confirmText?: string
  useBiometric?: boolean
  severity?: WarningSeverity
  isDismissible?: boolean
  hideHandlebar?: boolean
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
  onCancel,
  onConfirm,
  modalName,
  title,
  caption,
  closeText,
  confirmText,
  severity = WarningSeverity.Medium,
  children,
  useBiometric = false,
  isDismissible = true,
  hideHandlebar = false,
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
  const alertColor = getAlertColor(severity)

  return (
    <BottomSheetModal
      backgroundColor={theme.colors.background1}
      hideHandlebar={hideHandlebar}
      isDismissible={isDismissible}
      isVisible={isVisible}
      name={modalName}
      onClose={onClose}>
      <Flex centered gap="md" mb="lg" p="lg">
        <Flex centered borderColor={alertColor.text} borderRadius="md" borderWidth={1} p="sm">
          <AlertTriangleIcon color={theme.colors[alertColor.text]} height={24} width={24} />
        </Flex>
        <Text textAlign="center" variant="buttonLabelMedium">
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
            <Button
              fill
              emphasis={ButtonEmphasis.Tertiary}
              label={closeText}
              onPress={onCancel ?? onClose}
            />
          )}
          {confirmText && (
            <Button
              fill
              emphasis={ButtonEmphasis.Detrimental}
              label={confirmText}
              name={ElementName.Confirm}
              onPress={onPressConfirm}
            />
          )}
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

export const getAlertColor = (severity?: WarningSeverity): WarningColor => {
  switch (severity) {
    case WarningSeverity.High:
      return {
        text: 'accentCritical',
        background: 'accentCriticalSoft',
      }
    case WarningSeverity.Medium:
      return { text: 'accentWarning', background: 'accentWarningSoft' }
    case WarningSeverity.Critical:
      return {
        text: 'accentWarning',
        background: 'accentWarningSoft',
      }
    default:
      return { text: 'none', background: 'none' }
  }
}
