import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { WarningAction, WarningSeverity } from 'src/components/warnings/types'
import { getWarningColor } from 'src/components/warnings/utils'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { DerivedSwapInfo, useSwapCallback } from 'src/features/transactions/swap/hooks'
import { showWarningInPanel } from 'src/features/transactions/swap/validate'
import {
  transactionStateActions,
  WarningModalType,
} from 'src/features/transactions/transactionState/transactionState'

type Props = {
  dispatch: Dispatch<AnyAction>
  derivedSwapInfo: DerivedSwapInfo
  closeModal: () => void
}

// TODO: there is a WarningModal already in modals, should combine the two to have a unified warning schema for whole app
export function WarningModal({ dispatch, derivedSwapInfo, closeModal }: Props) {
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
    closeModal()
  }

  const { swapCallback } = useSwapCallback(
    trade,
    gasSpendEstimate,
    gasPrice,
    exactApproveRequired,
    swapMethodParameters,
    onExitSwap
  )

  const warning =
    warningModalType === WarningModalType.INFORMATIONAL
      ? warnings.find(showWarningInPanel)
      : warnings.find((w) => w.action === WarningAction.WarnBeforeSubmit)

  if (warningModalType === WarningModalType.NONE || !warning) return null

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
              variant={warning.severity === WarningSeverity.Medium ? 'warning' : 'failure'}
              onPress={swapCallback}
            />
          </Flex>
        )}
      </Flex>
    </BottomSheetModal>
  )
}
