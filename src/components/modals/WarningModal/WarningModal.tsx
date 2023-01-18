import React, { PropsWithChildren, ReactNode } from 'react'
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
  icon?: ReactNode
}

export function captionForAccountRemovalWarning(
  accountType: AccountType,
  t: TFunction<'translation'>
): string {
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
  icon,
}: PropsWithChildren<WarningModalProps>): JSX.Element {
  const { requiredForTransactions } = useBiometricAppSettings()
  const { trigger } = useBiometricPrompt(onConfirm)

  const onPressConfirm = (): void => {
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
      name={modalName}
      onClose={onClose}>
      <Flex centered gap="md" mb="lg" p="lg">
        <Flex centered borderColor={alertColor.text} borderRadius="md" borderWidth={1} p="sm">
          {icon ?? (
            <AlertTriangleIcon
              color={theme.colors[alertColor.text]}
              height={theme.iconSizes.lg}
              width={theme.iconSizes.lg}
            />
          )}
        </Flex>
        <Text textAlign="center" variant="bodyLarge">
          {title}
        </Text>
        {caption && (
          <Text color="textSecondary" textAlign="center" variant="bodySmall">
            {caption}
          </Text>
        )}
        {children}
        <Flex centered row gap="sm" pt={children ? 'sm' : 'lg'}>
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
              emphasis={alertColor.buttonEmphasis}
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
    case WarningSeverity.None:
      return {
        text: 'textSecondary',
        background: 'textSecondary',
        buttonEmphasis: ButtonEmphasis.Secondary,
      }
    case WarningSeverity.Low:
      return {
        text: 'textSecondary',
        background: 'background2',
        buttonEmphasis: ButtonEmphasis.Tertiary,
      }
    case WarningSeverity.High:
      return {
        text: 'accentCritical',
        background: 'accentCriticalSoft',
        buttonEmphasis: ButtonEmphasis.Detrimental,
      }
    case WarningSeverity.Medium:
      return {
        text: 'accentWarning',
        background: 'accentWarningSoft',
        buttonEmphasis: ButtonEmphasis.Warning,
      }
    default:
      return { text: 'textSecondary', background: 'none', buttonEmphasis: ButtonEmphasis.Tertiary }
  }
}
