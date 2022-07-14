import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { DerivedSwapInfo, useSwapCallback } from 'src/features/transactions/swap/hooks'
import {
  getSwapWarningColor,
  showWarningInPanel,
  SwapWarningAction,
  SwapWarningSeverity,
} from 'src/features/transactions/swap/validate'
import {
  transactionStateActions,
  WarningModalType,
} from 'src/features/transactions/transactionState/transactionState'

type Props = {
  dispatch: Dispatch<AnyAction>
  derivedSwapInfo: DerivedSwapInfo
  closeSwapModal: () => void
}

export function SwapWarningModal({ dispatch, derivedSwapInfo, closeSwapModal }: Props) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const {
    trade: { trade: trade },
    gasSpendEstimate,
    gasPrice,
    exactApproveRequired,
    swapMethodParameters,
    warnings,
    warningModalType,
  } = derivedSwapInfo

  const onClose = () => {
    dispatch(transactionStateActions.closeWarningModal())
  }

  const onExitSwap = () => {
    onClose()
    closeSwapModal()
  }

  const { swapCallback } = useSwapCallback(
    trade,
    gasSpendEstimate,
    gasPrice,
    exactApproveRequired,
    swapMethodParameters,
    onExitSwap
  )

  const swapWarning =
    warningModalType === WarningModalType.INFORMATIONAL
      ? warnings.find(showWarningInPanel)
      : warnings.find((warning) => warning.action === SwapWarningAction.WarnBeforeSwapSubmit)

  if (warningModalType === WarningModalType.NONE || !swapWarning) return null

  const swapWarningColor = getSwapWarningColor(swapWarning)

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
          borderColor={swapWarningColor.text}
          borderRadius="md"
          borderWidth={1}
          p="md">
          <AlertTriangle color={theme.colors[swapWarningColor.text]} height={20} width={20} />
        </Flex>
        <Text textAlign="center" variant="subhead">
          {swapWarning.title}
        </Text>
        <Text color="textSecondary" textAlign="center" variant="bodySmall">
          {swapWarning.message}
        </Text>
        {warningModalType === WarningModalType.INFORMATIONAL ? (
          <PrimaryButton
            label={t('OK')}
            name={ElementName.OK}
            py="md"
            textVariant="largeLabel"
            variant="blue"
            onPress={onClose}
          />
        ) : (
          <Flex row>
            <PrimaryButton
              flex={1}
              label={t('Cancel swap')}
              name={ElementName.Cancel}
              py="md"
              variant="transparent"
              onPress={onClose}
            />
            <PrimaryButton
              flex={1}
              label={t('Swap anyway')}
              name={ElementName.SwapAnyway}
              py="md"
              variant={swapWarning.severity === SwapWarningSeverity.Medium ? 'warning' : 'failure'}
              onPress={swapCallback}
            />
          </Flex>
        )}
      </Flex>
    </BottomSheetModal>
  )
}
