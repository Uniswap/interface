import { providers } from 'ethers/lib/ethers'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, FlexLoader, Separator, Skeleton, Text } from 'ui/src'
import { SlashCircle } from 'ui/src/components/icons/SlashCircle'
import { fonts } from 'ui/src/theme'
import { AuthTrigger } from 'uniswap/src/features/auth/types'
import { useUSDValueOfGasFee } from 'uniswap/src/features/gas/hooks'
import { useCancellationGasFeeInfo } from 'uniswap/src/features/gas/hooks/useCancellationGasFeeInfo'
import { PlanCancellationGasFeeDetails } from 'uniswap/src/features/gas/hooks/usePlanCancellationGasFeeInfo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { CancelableStepInfo } from 'uniswap/src/features/transactions/hooks/useIsCancelable'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  PlanTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { isWebPlatform } from 'utilities/src/platform'

export interface PlanCancellationInfo {
  isPlanCancellation: true
  planId: string
  cancelableStepInfo: CancelableStepInfo
}

export function CancelConfirmationView({
  authTrigger,
  onBack,
  onCancel,
  transactionDetails,
}: {
  authTrigger?: AuthTrigger
  onBack: () => void
  onCancel: (txRequest: providers.TransactionRequest, planCancellationInfo?: PlanCancellationInfo) => void
  transactionDetails: TransactionDetails
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const isPlan = transactionDetails.typeInfo.type === TransactionType.Plan
  const isUniswapXOrder = isUniswapX(transactionDetails)

  const cancellationGasFeeInfo = useCancellationGasFeeInfo(transactionDetails)
  const { value: gasFeeUSD } = useUSDValueOfGasFee(
    transactionDetails.chainId,
    cancellationGasFeeInfo?.gasFeeDisplayValue,
  )
  const gasFee = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)

  // Get cancelable step info for plans (if available in cancellation info)
  const cancelableStepInfo = useMemo(() => {
    if (!isPlan || !cancellationGasFeeInfo) {
      return undefined
    }
    return (cancellationGasFeeInfo as PlanCancellationGasFeeDetails).cancelableStepInfo
  }, [isPlan, cancellationGasFeeInfo])

  const onCancelConfirm = useCallback(() => {
    if (!cancellationGasFeeInfo?.cancelRequest) {
      return
    }

    if (isPlan && cancelableStepInfo) {
      // For plans, pass step info along with cancel request
      const planTypeInfo = transactionDetails.typeInfo as PlanTransactionInfo
      onCancel(cancellationGasFeeInfo.cancelRequest, {
        isPlanCancellation: true,
        planId: planTypeInfo.planId,
        cancelableStepInfo,
      })
    } else {
      onCancel(cancellationGasFeeInfo.cancelRequest)
    }
  }, [cancellationGasFeeInfo, onCancel, isPlan, cancelableStepInfo, transactionDetails])

  const onPressCancel = useCallback(async () => {
    if (authTrigger) {
      await authTrigger({ successCallback: onCancelConfirm, failureCallback: () => {} })
    } else {
      onCancelConfirm()
    }
  }, [authTrigger, onCancelConfirm])

  const title = useMemo(() => {
    if (isUniswapXOrder) {
      return t('common.cancelOrder')
    }
    return t('transaction.action.cancel.title')
  }, [isUniswapXOrder, t])

  // Determine warning message based on cancellation type
  const warningMessage = useMemo(() => {
    if (!isPlan) {
      if (isUniswapXOrder) {
        return t('swap.cancel.cannotExecute', { count: 1 })
      }
      return t('transaction.action.cancel.description')
    }

    if (cancelableStepInfo?.cancellationType === 'uniswapx') {
      return t('transaction.action.cancel.plan.uniswapx.warning')
    }

    return t('transaction.action.cancel.plan.warning')
  }, [isPlan, isUniswapXOrder, cancelableStepInfo, t])

  const disableConfirmationButton =
    !cancellationGasFeeInfo?.cancelRequest || transactionDetails.status !== TransactionStatus.Pending

  return (
    <Flex
      centered
      grow
      backgroundColor="$surface1"
      borderRadius="$rounded20"
      gap="$spacing16"
      mt={isWebPlatform ? '$spacing16' : '$none'}
      px={isWebPlatform ? '$none' : '$spacing24'}
      py={isWebPlatform ? '$none' : '$spacing12'}
    >
      <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
        <SlashCircle color="$neutral2" size="$icon.20" />
      </Flex>
      <Flex centered gap="$spacing8">
        <Text variant="buttonLabel2">{title}</Text>
        <Text color="$neutral2" textAlign="center" variant="body3">
          {warningMessage}
        </Text>
      </Flex>
      <Flex width="100%">
        <Separator />
      </Flex>
      <Flex row justifyContent="space-between" pb="$spacing8" px="$spacing12" width="100%">
        <Text color="$neutral2" variant="body3">
          {t('transaction.networkCost.label')}
        </Text>
        {!gasFeeUSD ? (
          <Skeleton>
            <FlexLoader borderRadius="$rounded4" height={fonts.body3.lineHeight} opacity={0.4} width="$spacing48" />
          </Skeleton>
        ) : (
          <Text variant="body3">{gasFee}</Text>
        )}
      </Flex>
      <Flex row gap="$spacing8" width="100%">
        <Button emphasis="secondary" onPress={onBack}>
          {t('common.button.back')}
        </Button>
        <Trace
          logPress
          element={ElementName.Confirm}
          modal={ModalName.TransactionCancellation}
          properties={{
            transaction_hash: transactionDetails.hash,
            chain_id: transactionDetails.chainId,
            status: transactionDetails.status,
          }}
        >
          <Button
            isDisabled={disableConfirmationButton}
            testID={TestID.Cancel}
            variant="critical"
            emphasis="secondary"
            onPress={onPressCancel}
          >
            {t('common.button.confirm')}
          </Button>
        </Trace>
      </Flex>
    </Flex>
  )
}
