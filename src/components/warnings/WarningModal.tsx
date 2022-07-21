import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { Warning, WarningSeverity } from 'src/components/warnings/types'
import { getWarningColor } from 'src/components/warnings/utils'
import { ElementName, ModalName } from 'src/features/telemetry/constants'

type Props = {
  cancelLabel?: string
  continueLabel?: string
  data?: string
  warning: Warning | undefined
  onClose: () => void
  onPressCancel?: () => void
  onPressContinue?: () => void
}

// TODO: there is a WarningModal already in modals, should combine the two to have a unified warning schema for whole app
export function WarningModal({
  cancelLabel,
  continueLabel,
  data,
  warning,
  onClose,
  onPressCancel,
  onPressContinue,
}: Props) {
  const theme = useAppTheme()
  const { t } = useTranslation()

  const onCancel = useCallback(() => {
    onClose()
    onPressCancel?.()
  }, [onClose, onPressCancel])

  const onContinue = useCallback(() => {
    onClose()
    onPressContinue?.()
  }, [onClose, onPressContinue])

  if (!warning) return null

  const warningColor = getWarningColor(warning)

  return (
    <BottomSheetModal
      isVisible
      backgroundColor={theme.colors.backgroundSurface}
      name={ModalName.SwapWarning}
      onClose={onClose}>
      <Flex borderRadius="md" gap="lg" px="lg" py="xl">
        <Flex
          centered
          alignSelf="center"
          borderColor={warningColor.text}
          borderRadius="md"
          borderWidth={1}
          p="md">
          <AlertTriangle color={theme.colors[warningColor.text]} height={20} width={20} />
        </Flex>
        <Text textAlign="center" variant="subhead">
          {warning.title}
        </Text>
        <Text color="textSecondary" textAlign="center" variant="bodySmall">
          {warning.message}
        </Text>
        {data && (
          <Box borderColor="backgroundOutline" borderRadius="xs" borderWidth={1}>
            <Text color="textPrimary" px="md" py="sm" textAlign="center" variant="subheadSmall">
              {data}
            </Text>
          </Box>
        )}
        {onPressContinue ? (
          <Flex row gap="xs">
            <PrimaryButton
              borderRadius="md"
              flex={1}
              label={cancelLabel ?? t('Cancel')}
              name={ElementName.Cancel}
              variant="transparent"
              onPress={onCancel}
            />
            <PrimaryButton
              borderRadius="md"
              flex={1}
              label={continueLabel ?? t('Confirm')}
              name={ElementName.SwapAnyway}
              variant={warning.severity === WarningSeverity.Medium ? 'warning' : 'failure'}
              onPress={onContinue}
            />
          </Flex>
        ) : (
          <PrimaryButton
            label={t('OK')}
            name={ElementName.OK}
            py="md"
            textVariant="largeLabel"
            variant="blue"
            onPress={onClose}
          />
        )}
      </Flex>
    </BottomSheetModal>
  )
}
