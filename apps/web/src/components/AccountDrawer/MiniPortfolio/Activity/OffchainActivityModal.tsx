import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { TFunction } from 'i18next'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, styled, TouchableArea } from 'ui/src'
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
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
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
} from '~/components/AccountDrawer/MiniPortfolio/Activity/CancelOrdersDialog'
import {
  OffchainOrderLineItem,
  OffchainOrderLineItemProps,
  OffchainOrderLineItemType,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/OffchainOrderLineItem'
import { useCancelMultipleOrdersCallback } from '~/components/AccountDrawer/MiniPortfolio/Activity/utils/cancel'
import { PortfolioLogo } from '~/components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import AlertTriangleFilled from '~/components/Icons/AlertTriangleFilled'
import { LimitDisclaimer } from '~/components/swap/LimitDisclaimer'
import { SwapModalHeaderAmount } from '~/components/swap/SwapModalHeaderAmount'
import { useCurrency } from '~/hooks/Tokens'
import { useUniswapXOrderByOrderHash } from '~/state/transactions/hooks'
import { ThemedText } from '~/theme/components'
import { Divider } from '~/theme/components/Dividers'

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

const OffchainModalDivider = styled(Divider, {
  my: '$spacing28',
})

const InsufficientFundsCopyContainer = styled(Flex, {
  row: true,
  mt: '$spacing16',
  p: '$spacing12',
  borderWidth: 1.3,
  borderStyle: 'solid',
  borderColor: '$surface3',
  borderRadius: '$rounded20',
  gap: '$gap12',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
})

const AlertIconContainer = styled(Flex, {
  flexShrink: 0,
  backgroundColor: '$statusWarning',
  width: 40,
  height: 40,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '$rounded12',
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

function getOrderTitle({
  routing,
  orderStatus,
  t,
}: {
  routing: TradingApi.Routing | undefined
  orderStatus: TransactionStatus
  t: TFunction
}): string {
  const isLimit = routing === TradingApi.Routing.DUTCH_LIMIT
  switch (orderStatus) {
    case TransactionStatus.Pending:
      return isLimit ? t('common.limit.pending') : t('common.orderPending')
    case TransactionStatus.Expired:
      return isLimit ? t('common.limit.expired') : t('common.orderExpired')
    case TransactionStatus.Cancelling:
      return t('common.pending.cancellation')
    case TransactionStatus.InsufficientFunds:
      return t('common.insufficient.funds')
    case TransactionStatus.Canceled:
      return isLimit ? t('common.limit.canceled') : t('common.orderCanceled')
    case TransactionStatus.Success:
      return isLimit ? t('common.limit.executed') : t('common.orderExecuted')
    default:
      return ''
  }
}

export function OrderContent({ order, onCancel }: { order: UniswapXOrderDetails; onCancel?: () => void }) {
  const { t } = useTranslation()
  const amounts = useOrderAmounts(order)
  const amountsDefined = !!amounts?.inputAmount.currency && !!amounts.outputAmount.currency
  const fiatValueInput = useUSDCValue(amounts?.inputAmount)
  const fiatValueOutput = useUSDCValue(amounts?.outputAmount)
  const localizedDayjs = useLocalizedDayjs()

  const explorerLink = order.hash
    ? getExplorerLink({ chainId: order.chainId, data: order.hash, type: ExplorerDataType.TRANSACTION })
    : undefined

  const createdAt = useFormattedDateTime(localizedDayjs(order.addedTime), FORMAT_DATE_TIME_SHORT)

  const details: Array<OffchainOrderLineItemProps> = useMemo(() => {
    const details = []
    if (amountsDefined) {
      details.push({ type: OffchainOrderLineItemType.EXCHANGE_RATE, amounts } as OffchainOrderLineItemProps)
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

  const orderTitle = useMemo(
    () => getOrderTitle({ routing: order.routing, orderStatus: order.status, t }),
    [order.routing, order.status, t],
  )

  if (!amounts?.inputAmount) {
    return null
  }

  return (
    <Flex>
      <Flex row gap="$gap12">
        <PortfolioLogo chainId={amounts.inputAmount.currency.chainId} currencies={currencies} />
        <Flex>
          <ThemedText.SubHeader fontWeight={500}>{orderTitle}</ThemedText.SubHeader>
          <ThemedText.BodySmall color="neutral2" fontWeight={500}>
            {createdAt}
          </ThemedText.BodySmall>
        </Flex>
      </Flex>
      <OffchainModalDivider />
      <Flex gap="$gap12">
        <SwapModalHeaderAmount
          field={CurrencyField.INPUT}
          label={undefined}
          amount={amounts.inputAmount}
          currency={amounts.inputAmount.currency}
          usdAmount={fiatValueInput?.toExact()}
          isLoading={false}
          headerTextProps={{ fontSize: '24px', lineHeight: '32px' }}
        />
        <ArrowDown size="$icon.20" color="$neutral3" />
        <SwapModalHeaderAmount
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
      {order.status === TransactionStatus.InsufficientFunds ? (
        <InsufficientFundsCopyContainer>
          <AlertIconContainer>
            <AlertTriangleFilled size="20px" />
          </AlertIconContainer>
          <Flex flex={1}>
            <ThemedText.SubHeader lineHeight="24px">{t('common.insufficientBalance.error')}</ThemedText.SubHeader>
            <ThemedText.SubHeaderSmall lineHeight="20px">
              {order.routing === TradingApi.Routing.DUTCH_LIMIT
                ? t('account.portfolio.activity.signLimit')
                : t('account.portfolio.activity.canceledBelow')}
            </ThemedText.SubHeaderSmall>
          </Flex>
        </InsufficientFundsCopyContainer>
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
  const [cancelState, setCancelState] = useState(CancellationState.NOT_STARTED)
  const [cancelTxHash, setCancelTxHash] = useState<string | undefined>()
  const setSelectedOrder = useUpdateAtom(selectedOrderAtom)

  const reset = () => {
    setSelectedOrder(undefined)
  }

  const cancelOrders = useCancelMultipleOrdersCallback([order])

  return (
    <>
      <CancelOrdersDialog
        isVisible={cancelState !== CancellationState.NOT_STARTED}
        orders={[order]}
        onCancel={() => {
          setCancelState(CancellationState.NOT_STARTED)
          if (cancelState !== CancellationState.REVIEWING_CANCELLATION) {
            reset()
          }
        }}
        onConfirm={async () => {
          setCancelState(CancellationState.PENDING_SIGNATURE)
          const transactions = await cancelOrders()
          if (transactions && transactions.length > 0) {
            setCancelState(CancellationState.PENDING_CONFIRMATION)
            setCancelTxHash(transactions[0].hash)
            try {
              await transactions[0].wait(1)
              setCancelState(CancellationState.CANCELLED)
            } catch {
              setCancelState(CancellationState.REVIEWING_CANCELLATION)
            }
          } else {
            setCancelState(CancellationState.REVIEWING_CANCELLATION)
          }
        }}
        cancelState={cancelState}
        cancelTxHash={cancelTxHash}
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
            <ThemedText.SubHeader fontWeight={500}>{t('common.transactionDetails')}</ThemedText.SubHeader>
            <TouchableArea onPress={reset}>
              <X size="$icon.20" color="$neutral1" hoverColor="$neutral1Hovered" />
            </TouchableArea>
          </Flex>
          <OrderContent
            order={order}
            onCancel={() => {
              setCancelState(CancellationState.REVIEWING_CANCELLATION)
            }}
          />
        </Wrapper>
      </Modal>
    </>
  )
}

export function OffchainActivityModal() {
  const selectedOrderAtomValue = useAtomValue(selectedOrderAtom)
  const syncedSelectedOrder = useSyncedSelectedOrder()

  if (!syncedSelectedOrder || !selectedOrderAtomValue?.modalOpen) {
    return null
  }

  return <OffchainActivityModalContent key={syncedSelectedOrder.id} order={syncedSelectedOrder} />
}
