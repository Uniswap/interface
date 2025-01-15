import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Flex, Separator, Text, isWeb, useIsShortMobileDevice } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import { updateTransaction } from 'uniswap/src/features/transactions/slice'
import {
  QueuedOrderStatus,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { isMobileApp } from 'utilities/src/platform'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { SwapTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/SwapTransactionDetails'
import { isSwapTransactionInfo } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/types'
import { ErroredQueuedOrderStatus, useErroredQueuedOrders } from 'wallet/src/features/transactions/hooks'
import { useActiveSignerAccount } from 'wallet/src/features/wallet/hooks'

export function QueuedOrderModal(): JSX.Element | null {
  const { t } = useTranslation()
  const uniswapXEnabled = useFeatureFlag(FeatureFlags.UniswapX)
  const isShortMobileDevice = useIsShortMobileDevice()

  const account = useActiveSignerAccount()
  const erroredQueuedOrders = useErroredQueuedOrders(account?.address ?? null)
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

  const localTransactions = useSelectAddressTransactions(account?.address ?? null)
  // If a wrap tx was involved as part of the order flow, show a message indicating that the user now has WETH,
  // unless the wrap failed, in which case the user still has ETH and the message should not be shown.
  const showWrapMessage = useMemo(() => {
    if (!currentFailedOrder || currentFailedOrder?.queueStatus === QueuedOrderStatus.WrapFailed) {
      return false
    }
    return localTransactions?.some(
      (tx) => tx.typeInfo.type === TransactionType.Wrap && tx.typeInfo.swapTxId === currentFailedOrder?.id,
    )
  }, [localTransactions, currentFailedOrder])

  // If there are no failed orders tracked in state, return nothing.
  if (!uniswapXEnabled || !currentFailedOrder || !isSwapTransactionInfo(currentFailedOrder.typeInfo)) {
    return null
  }

  const QUEUE_STATUS_TO_MESSAGE = {
    [QueuedOrderStatus.AppClosed]: t('swap.warning.queuedOrder.appClosed'),
    [QueuedOrderStatus.ApprovalFailed]: t('swap.warning.queuedOrder.approvalFailed'),
    [QueuedOrderStatus.WrapFailed]: t('swap.warning.queuedOrder.wrapFailed'),
    [QueuedOrderStatus.SubmissionFailed]: t('swap.warning.queuedOrder.submissionFailed'),
    [QueuedOrderStatus.Stale]: t('swap.warning.queuedOrder.stale'),
  } as const satisfies Record<ErroredQueuedOrderStatus, string>
  const reason = QUEUE_STATUS_TO_MESSAGE[currentFailedOrder.queueStatus]

  const buttonSize = isShortMobileDevice ? 'small' : 'medium'

  const platformButtonStyling = isWeb ? { flex: 1, flexBasis: 1 } : undefined

  return (
    <ErrorBoundary showNotification fallback={null} name={ModalName.QueuedOrderModal} onError={onCancel}>
      <Modal isDismissible alignment="top" name={ModalName.TransactionDetails} onClose={onCancel}>
        <Flex gap="$spacing12" pb={isWeb ? '$none' : '$spacing12'} px={isWeb ? '$none' : '$spacing24'}>
          <Flex centered gap="$spacing8">
            <Flex centered backgroundColor="$surface2" borderRadius="$rounded12" mb="$spacing8" p="$spacing12">
              <AlertTriangleFilled color="$black" size="$icon.24" />
            </Flex>

            <Text textAlign="center" variant="subheading1">
              {t('swap.warning.queuedOrder.title')}
            </Text>
            <Text color="$neutral2" textAlign="center" variant="body3">
              {reason}
              {showWrapMessage && ' '}
              {showWrapMessage && t('swap.warning.queuedOrder.wrap.message')}
            </Text>
            <LearnMoreLink
              textColor="$neutral1"
              textVariant="buttonLabel2"
              url={uniswapUrls.helpArticleUrls.uniswapXFailure}
            />
          </Flex>
          <Separator />
          <SwapTransactionDetails disableClick={isMobileApp} typeInfo={currentFailedOrder.typeInfo} />
          <Flex gap="$spacing8" row={isWeb}>
            <Button
              disabled={!transactionState}
              theme="primary"
              {...platformButtonStyling}
              size={buttonSize}
              onPress={onRetry}
            >
              <Text color="$white" variant="buttonLabel2">
                {t('common.button.retry')}
              </Text>
            </Button>
            <Button {...platformButtonStyling} size={buttonSize} theme="secondary" onPress={onCancel}>
              <Text variant="buttonLabel2">{t('common.button.cancel')}</Text>
            </Button>
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
