import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, styled, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import {
  FORMAT_DATE_TIME_SHORT,
  useFormattedDateTime,
  useLocalizedDayjs,
} from 'uniswap/src/features/language/localizedDayjs'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { trackOrderCancellation } from 'uniswap/src/features/transactions/cancel/cancelMultipleOrders'
import { isCancelTimedOut } from 'uniswap/src/features/transactions/cancel/cancelTimeoutStateMachine'
import { checkCancelOrder } from 'uniswap/src/features/transactions/cancel/getCancelOrderTxRequest'
import { toCancelRevertStatus } from 'uniswap/src/features/transactions/cancel/orderCancelCaseReducers'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { addTransaction, cancelTransaction, TransactionsState } from 'uniswap/src/features/transactions/slice'
import { hasTradeType } from 'uniswap/src/features/transactions/swap/utils/trade'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isLimitCancellable } from 'uniswap/src/features/transactions/utils/uniswapX.utils'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import {
  CancellationState,
  CancelOrdersDialog,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/cancel/CancelOrdersDialog'
import {
  OffchainOrderLineItem,
  OffchainOrderLineItemProps,
  OffchainOrderLineItemType,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/OffchainOrderLineItem'
import { PortfolioLogo } from '~/components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { AmountHeader } from '~/components/AmountHeader'
import { LimitDisclaimer } from '~/components/LimitDisclaimer'
import {
  AlertIconContainer,
  CancelTimeoutAlert,
  getOrderTitle,
  OrderAlertContainer,
  showCancelPreCheckRefusalPopup,
} from '~/components/modals/OffchainActivityCancelFlow'
import { useCurrency } from '~/hooks/Tokens'
import { useSelectChain } from '~/hooks/useSelectChain'
import store from '~/state'
import { useAppDispatch } from '~/state/hooks'
import { useRevertCancellationCallback } from '~/state/sagas/transactions/revertCancellationSaga'
import { useUniswapXOrderByOrderHash } from '~/state/transactions/hooks'
type SelectedOrderInfo = {
  modalOpen?: boolean
  order?: UniswapXOrderDetails
}

const selectedOrderAtom = atom<SelectedOrderInfo | undefined>(undefined)

export function useOpenOffchainActivityModal() {
  const setSelectedOrder = useUpdateAtom(selectedOrderAtom)

  return useCallback(
    (order: UniswapXOrderDetails) => {
      sendAnalyticsEvent(InterfaceEventName.UniswapXOrderDetailsSheetOpened, {
        order: order.orderHash ?? order.id,
      })
      setSelectedOrder({ order, modalOpen: true })
    },
    [setSelectedOrder],
  )
}

const Wrapper = styled(Flex, {
  gap: '$gap12',
  grow: true,
  pt: '$spacing12',
  pb: '$spacing20',
  px: '$spacing20',
  width: '100%',
  backgroundColor: '$surface1',
})

const OffchainModalDivider = styled(Separator, {
  my: '$spacing28',
})

export function useOrderAmounts(order?: UniswapXOrderDetails):
  | {
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }
  | undefined {
  const typeInfo = order?.typeInfo
  const swapInfo = typeInfo && hasTradeType(typeInfo) ? typeInfo : undefined

  const inputCurrency = useCurrency({
    address: swapInfo ? currencyIdToAddress(swapInfo.inputCurrencyId) : undefined,
    chainId: order?.chainId,
  })
  const outputCurrency = useCurrency({
    address: swapInfo ? currencyIdToAddress(swapInfo.outputCurrencyId) : undefined,
    chainId: order?.chainId,
  })

  if (!order || !swapInfo) {
    return undefined
  }

  if (!inputCurrency || !outputCurrency) {
    logger.warn('OffchainActivityModal', 'useOrderAmounts', 'Could not find token(s) for order', {
      hash: order.hash,
    })
    return undefined
  }

  if (swapInfo.tradeType === TradeType.EXACT_INPUT) {
    return {
      inputAmount: CurrencyAmount.fromRawAmount(inputCurrency, swapInfo.inputCurrencyAmountRaw),
      outputAmount: CurrencyAmount.fromRawAmount(
        outputCurrency,
        swapInfo.settledOutputCurrencyAmountRaw ?? swapInfo.expectedOutputCurrencyAmountRaw,
      ),
    }
  } else {
    return {
      inputAmount: CurrencyAmount.fromRawAmount(inputCurrency, swapInfo.expectedInputCurrencyAmountRaw),
      outputAmount: CurrencyAmount.fromRawAmount(outputCurrency, swapInfo.outputCurrencyAmountRaw),
    }
  }
}

export function OrderContent({
  order,
  onCancel,
  onRevert,
}: {
  order: UniswapXOrderDetails
  onCancel?: () => void
  onRevert?: () => void
}) {
  const { t } = useTranslation()
  const isCancelTimeoutEnabled = useFeatureFlag(FeatureFlags.LimitCancelTimeout)
  // Persisted-deadline re-evaluation tick: the timed-out alert derives from the record + wall
  // clock, so re-render periodically while a cancellation is in flight
  const [, setNowMs] = useState(Date.now())
  useEffect(() => {
    if (order.status !== TransactionStatus.Cancelling) {
      return undefined
    }
    const interval = setInterval(() => setNowMs(Date.now()), 15_000)
    return () => clearInterval(interval)
  }, [order.status])
  const isTimedOut = isCancelTimeoutEnabled && isCancelTimedOut(order)
  const amounts = useOrderAmounts(order)
  const amountsDefined = !!amounts?.inputAmount.currency && !!amounts.outputAmount.currency
  const fiatValueInput = useUSDCValue(amounts?.inputAmount)
  const fiatValueOutput = useUSDCValue(amounts?.outputAmount)
  const localizedDayjs = useLocalizedDayjs()

  const explorerLink = order.hash
    ? getExplorerLink({
        chainId: order.chainId,
        data: order.hash,
        type: ExplorerDataType.TRANSACTION,
      })
    : undefined

  const createdAt = useFormattedDateTime(localizedDayjs(order.addedTime), FORMAT_DATE_TIME_SHORT)

  const details: Array<OffchainOrderLineItemProps> = useMemo(() => {
    // oxlint-disable-next-line no-shadow
    const details = []
    if (amountsDefined) {
      details.push({
        type: OffchainOrderLineItemType.EXCHANGE_RATE,
        amounts,
      } as OffchainOrderLineItemProps)
    }
    if (order.status === TransactionStatus.Pending) {
      details.push({
        type: OffchainOrderLineItemType.EXPIRY,
        order,
      } as OffchainOrderLineItemProps)
    }
    details.push({
      type: OffchainOrderLineItemType.NETWORK_COST,
    } as OffchainOrderLineItemProps)
    if (explorerLink) {
      details.push({
        type: OffchainOrderLineItemType.TRANSACTION_ID,
        explorerLink,
        order,
      } as OffchainOrderLineItemProps)
    }
    return details
  }, [amounts, amountsDefined, explorerLink, order])

  const currencies = useMemo(
    () => [amounts?.inputAmount.currency, amounts?.outputAmount.currency],
    [amounts?.inputAmount.currency, amounts?.outputAmount.currency],
  )

  const orderTitle = getOrderTitle({ order, t })

  if (!amounts?.inputAmount) {
    return null
  }

  return (
    <Flex>
      <Flex row gap="$gap12">
        <PortfolioLogo chainId={amounts.inputAmount.currency.chainId} currencies={currencies} />
        <Flex>
          <Text variant="body2">{orderTitle}</Text>
          <Text variant="body3" color="$neutral2">
            {createdAt}
          </Text>
        </Flex>
      </Flex>
      <OffchainModalDivider />
      <Flex gap="$gap12">
        <AmountHeader
          field={CurrencyField.INPUT}
          label={undefined}
          amount={amounts.inputAmount}
          currency={amounts.inputAmount.currency}
          usdAmount={fiatValueInput?.toExact()}
          isLoading={false}
          headerTextProps={{ fontSize: '24px', lineHeight: '32px' }}
        />
        <ArrowDown size="$icon.20" color="$neutral3" />
        <AmountHeader
          field={CurrencyField.OUTPUT}
          label={undefined}
          amount={amounts.outputAmount}
          currency={amounts.outputAmount.currency}
          usdAmount={fiatValueOutput?.toExact()}
          isLoading={false}
          headerTextProps={{ fontSize: '24px', lineHeight: '32px' }}
        />
      </Flex>
      <OffchainModalDivider />
      <Flex gap="$gap8">
        {details.map((detail) => (
          <OffchainOrderLineItem key={detail.type} {...detail} />
        ))}
      </Flex>
      {Boolean(isLimitCancellable(order) && (order.encodedOrder || order.orderHash)) && (
        <Flex mt="$spacing12" row>
          <Button size="small" variant="default" emphasis="secondary" onPress={onCancel}>
            {order.routing === TradingApi.Routing.DUTCH_LIMIT
              ? t('common.limit.cancel', { count: 1 })
              : t('common.cancelOrder')}
          </Button>
        </Flex>
      )}
      {isTimedOut && <CancelTimeoutAlert order={order} onRevert={onRevert} />}
      {order.status === TransactionStatus.InsufficientFunds ? (
        <OrderAlertContainer>
          <AlertIconContainer>
            <AlertTriangleFilled color="$neutral2" size="$icon.20" />
          </AlertIconContainer>
          <Flex flex={1}>
            <Text variant="body2">{t('common.insufficientBalance.error')}</Text>
            <Text variant="body3" color="$neutral2">
              {order.routing === TradingApi.Routing.DUTCH_LIMIT
                ? t('account.portfolio.activity.signLimit')
                : t('account.portfolio.activity.canceledBelow')}
            </Text>
          </Flex>
        </OrderAlertContainer>
      ) : order.routing === TradingApi.Routing.DUTCH_LIMIT ? (
        <LimitDisclaimer />
      ) : null}
    </Flex>
  )
}

/* Returns the order currently selected in the UI synced with updates from order status polling */
function useSyncedSelectedOrder(): UniswapXOrderDetails | undefined {
  const selectedOrder = useAtomValue(selectedOrderAtom)
  const localPendingOrder = useUniswapXOrderByOrderHash(selectedOrder?.order?.orderHash ?? '')

  return useMemo(() => {
    if (!selectedOrder?.order) {
      return undefined
    }

    if (selectedOrder.order.status === TransactionStatus.Success) {
      return selectedOrder.order
    }

    return {
      ...selectedOrder.order,
      ...localPendingOrder,
    }
  }, [localPendingOrder, selectedOrder])
}

/**
 * This is the modal that appears when you click on an X order in the activity tab.
 *
 * It needs to handle multiple types of X orders:
 * - Pending orders initiated locally i.e. UniswapXOrderDetails
 * - Pending/expired/cancelled orders initiated remotely and tracked locally i.e. SwapOrderDetailsParts from the Activity query
 * - Filled orders i.e. TransactionDetailsParts from the Activity query.
 *
 * Because of this, we try to converge the different cases into the one type, UniswapXOrderDetails,
 * which can be passed around within the Activity in the case of remote records. However, all the fields may not
 * be defined in the remote cases.
 */
function OffchainActivityModalContent({ order }: { order: UniswapXOrderDetails }) {
  const { t } = useTranslation()
  // Whether the user entered the cancel flow from this modal; everything past that is derived
  // from the tracked record (the cancel saga has no return channel)
  const [cancelRequested, setCancelRequested] = useState(false)
  // Between confirm click and the cancelTransaction dispatch (async pre-check + chain switch)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)
  const setSelectedOrder = useUpdateAtom(selectedOrderAtom)
  const dispatch = useAppDispatch()
  const selectChain = useSelectChain()
  const revertCancellation = useRevertCancellationCallback()

  const reset = () => {
    setSelectedOrder(undefined)
  }

  // Dialog progress derives from the tracked record, not a returned ContractTransaction:
  // Cancelling + no hash → awaiting signature; hash set → awaiting confirmation (explorer link
  // reads the persisted cancelTxHash); mined/Canceled → done; reverted to Pending/InsufficientFunds
  // (rejection or broadcast failure) → back to review.
  const cancelState: CancellationState = useMemo(() => {
    if (!cancelRequested) {
      return CancellationState.NOT_STARTED
    }
    if (
      order.status === TransactionStatus.Canceled ||
      (order.status === TransactionStatus.Cancelling && order.cancelTxMined)
    ) {
      return CancellationState.CANCELLED
    }
    if (order.status === TransactionStatus.Cancelling) {
      return order.cancelTxHash ? CancellationState.PENDING_CONFIRMATION : CancellationState.PENDING_SIGNATURE
    }
    return awaitingConfirm ? CancellationState.PENDING_SIGNATURE : CancellationState.REVIEWING_CANCELLATION
  }, [cancelRequested, awaitingConfirm, order.status, order.cancelTxMined, order.cancelTxHash])

  const onConfirm = useCallback(async () => {
    setAwaitingConfirm(true)
    try {
      // Re-homed UniswapXOrderCancelInitiated: exactly once, before the wallet prompt
      trackOrderCancellation([order])

      // Fresh cancellable pre-check (OPEN and INSUFFICIENT_FUNDS pass); builds the cancel tx.
      // Never reuse the gas-estimate's cached request — it is built without a status check.
      const preCheck = await checkCancelOrder(order)
      if (preCheck.kind !== 'ready') {
        // Order is no longer cancellable (filled/expired/cancelled) or nothing could be built:
        // close the dialog but SAY why — a silent close reads as a broken button
        setAwaitingConfirm(false)
        setCancelRequested(false)
        showCancelPreCheckRefusalPopup({ preCheck, orderId: order.id })
        return
      }
      const { cancelRequest } = preCheck

      // This modal serves every UniswapX order type — L2 Dutch/Priority cancels need the switch
      const chainSwitched = await selectChain(order.chainId)
      if (!chainSwitched) {
        setAwaitingConfirm(false)
        return
      }

      // The modal can open from activity rows whose order is not in the slice yet;
      // cancelTransaction asserts the record exists
      const existsInSlice = Boolean(
        (store.getState() as { transactions: TransactionsState }).transactions[order.from]?.[order.chainId]?.[order.id],
      )
      if (!existsInSlice) {
        dispatch(addTransaction(order))
      }

      dispatch(
        cancelTransaction({
          chainId: order.chainId,
          id: order.id,
          address: order.from,
          cancelRequest,
          cancelInitiatedTimeMs: Date.now(),
          revertToStatus: toCancelRevertStatus(order.status),
        }),
      )
    } catch (error) {
      logger.error(error, {
        tags: { file: 'OffchainActivityModal', function: 'onConfirm' },
        extra: { orderHash: order.orderHash },
      })
    } finally {
      setAwaitingConfirm(false)
    }
  }, [dispatch, order, selectChain])

  const onRevert = useCallback(() => {
    revertCancellation(order)
  }, [order, revertCancellation])

  return (
    <>
      <CancelOrdersDialog
        isVisible={cancelState !== CancellationState.NOT_STARTED}
        orders={[order]}
        onCancel={() => {
          setCancelRequested(false)
          setAwaitingConfirm(false)
          if (cancelState !== CancellationState.REVIEWING_CANCELLATION) {
            reset()
          }
        }}
        onConfirm={onConfirm}
        cancelState={cancelState}
        cancelTxHash={order.cancelTxHash}
      />
      <Modal
        name={ModalName.OffchainActivity}
        maxWidth={375}
        isModalOpen={cancelState === CancellationState.NOT_STARTED}
        onClose={reset}
        padding={0}
      >
        <Wrapper data-testid="offchain-activity-modal">
          <Flex row justifyContent="space-between">
            <Text variant="body2">{t('common.transactionDetails')}</Text>
            <TouchableArea onPress={reset}>
              <X size="$icon.20" color="$neutral1" hoverColor="$neutral1Hovered" />
            </TouchableArea>
          </Flex>
          <OrderContent
            order={order}
            onCancel={() => {
              setCancelRequested(true)
            }}
            onRevert={onRevert}
          />
        </Wrapper>
      </Modal>
    </>
  )
}

export default function OffchainActivityModal() {
  const selectedOrderAtomValue = useAtomValue(selectedOrderAtom)
  const syncedSelectedOrder = useSyncedSelectedOrder()

  if (!syncedSelectedOrder || !selectedOrderAtomValue?.modalOpen) {
    return null
  }

  return <OffchainActivityModalContent key={syncedSelectedOrder.id} order={syncedSelectedOrder} />
}
