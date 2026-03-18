import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Flex, Separator, Text, useIsShortMobileDevice } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { SwapTransactionDetails } from 'uniswap/src/components/activity/details/transactions/SwapTransactionDetails'
import { isSwapTransactionInfo } from 'uniswap/src/components/activity/details/types'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  ErroredQueuedOrderStatus,
  useErroredQueuedOrders,
} from 'uniswap/src/features/transactions/hooks/useErroredQueuedOrder'
import { updateTransaction } from 'uniswap/src/features/transactions/slice'
import {
  QueuedOrderStatus,
  TransactionDetails,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { isMobileApp, isWebPlatform } from 'utilities/src/platform'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveSignerAccount } from 'wallet/src/features/wallet/hooks'

export function QueuedOrderModal(): JSX.Element | null {
  const { t } = useTranslation()
  const uniswapXEnabled = useFeatureFlag(FeatureFlags.UniswapX)
  const isShortMobileDevice = useIsShortMobileDevice()

  const account = useActiveSignerAccount()
  const erroredQueuedOrders = useErroredQueuedOrders({ evmAddress: account?.address })
  const currentFailedOrder = erroredQueuedOrders?.[0]

  const dispatch = useDispatch()
  const onCancel = useCallback(() => {
    if (!currentFailedOrder) {
      return
    }
    dispatch(updateTransaction({ ...currentFailedOrder, status: TransactionStatus.Canceled }))
  }, [dispatch, currentFailedOrder])

  const { navigateToSwapFlow } = useWalletNavigation()
  const transactionState = useTransactionState(currentFailedOrder)
  const onRetry = useCallback(() => {
    if (transactionState) {
      navigateToSwapFlow({ initialState: transactionState })
      onCancel()
    }
  }, [transactionState, navigateToSwapFlow, onCancel])

  // If there are no failed orders tracked in state, return nothing.
  if (!uniswapXEnabled || !currentFailedOrder || !isSwapTransactionInfo(currentFailedOrder.typeInfo)) {
    return null
  }

  const QUEUE_STATUS_TO_MESSAGE = {
    [QueuedOrderStatus.AppClosed]: t('swap.warning.queuedOrder.appClosed'),
    [QueuedOrderStatus.ApprovalFailed]: t('swap.warning.queuedOrder.approvalFailed'),
    [QueuedOrderStatus.SubmissionFailed]: t('swap.warning.queuedOrder.submissionFailed'),
    [QueuedOrderStatus.Stale]: t('swap.warning.queuedOrder.stale'),
  } as const satisfies Record<ErroredQueuedOrderStatus, string>
  const reason = QUEUE_STATUS_TO_MESSAGE[currentFailedOrder.queueStatus]

  const buttonSize = isShortMobileDevice ? 'small' : 'medium'

  const platformButtonStyling = isWebPlatform ? { flex: 1, flexBasis: 1 } : undefined

  return (
    <ErrorBoundary showNotification fallback={null} name={ModalName.QueuedOrderModal} onError={onCancel}>
      <Modal isDismissible alignment="top" name={ModalName.TransactionDetails} onClose={onCancel}>
        <Flex gap="$spacing12" pb={isWebPlatform ? '$none' : '$spacing12'} px={isWebPlatform ? '$none' : '$spacing24'}>
          <Flex centered gap="$spacing8">
            <Flex centered backgroundColor="$surface2" borderRadius="$rounded12" mb="$spacing8" p="$spacing12">
              <AlertTriangleFilled color="$black" size="$icon.24" />
            </Flex>

            <Text textAlign="center" variant="subheading1">
              {t('swap.warning.queuedOrder.title')}
            </Text>
            <Text color="$neutral2" textAlign="center" variant="body3">
              {reason}
            </Text>
            <LearnMoreLink
              textColor="$neutral1"
              textVariant="buttonLabel2"
              url={uniswapUrls.helpArticleUrls.uniswapXFailure}
            />
          </Flex>
          <Separator />
          <SwapTransactionDetails disableClick={isMobileApp} typeInfo={currentFailedOrder.typeInfo} />
          <Flex gap="$spacing8" row={isWebPlatform}>
            <Flex row>
              <Button
                isDisabled={!transactionState}
                variant="branded"
                {...platformButtonStyling}
                size={buttonSize}
                onPress={onRetry}
              >
                {t('common.button.retry')}
              </Button>
            </Flex>
            <Flex row>
              <Button {...platformButtonStyling} size={buttonSize} emphasis="secondary" onPress={onCancel}>
                {t('common.button.cancel')}
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Modal>
    </ErrorBoundary>
  )
}

function useTransactionState(transaction: TransactionDetails | undefined): TransactionState | undefined {
  const { typeInfo } = transaction ?? {}
  const isSwap = typeInfo && isSwapTransactionInfo(typeInfo)

  const inputCurrency = useCurrencyInfo(isSwap ? typeInfo.inputCurrencyId : undefined)?.currency
  const outputCurrency = useCurrencyInfo(isSwap ? typeInfo.outputCurrencyId : undefined)?.currency

  return useMemo(() => {
    if (!isSwap || !inputCurrency || !outputCurrency) {
      return undefined
    }

    const input: TradeableAsset = {
      address: currencyAddress(inputCurrency),
      chainId: inputCurrency.chainId,
      type: AssetType.Currency,
    }

    const output: TradeableAsset = {
      address: currencyAddress(outputCurrency),
      chainId: inputCurrency.chainId,
      type: AssetType.Currency,
    }

    const exactCurrency = typeInfo.tradeType === TradeType.EXACT_INPUT ? inputCurrency : outputCurrency
    const exactCurrencyField = typeInfo.tradeType === TradeType.EXACT_INPUT ? CurrencyField.INPUT : CurrencyField.OUTPUT
    const exactAmountTokenRaw =
      typeInfo.tradeType === TradeType.EXACT_INPUT ? typeInfo.inputCurrencyAmountRaw : typeInfo.outputCurrencyAmountRaw

    const exactAmountToken = CurrencyAmount.fromRawAmount(exactCurrency, exactAmountTokenRaw).toExact()

    return {
      input,
      output,
      exactCurrencyField,
      exactAmountToken,
      customSlippageTolerance: typeInfo.slippageTolerance,
    }
  }, [isSwap, typeInfo, inputCurrency, outputCurrency])
}
