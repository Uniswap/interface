import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import {
  CancellationState,
  CancelOrdersDialog,
} from 'components/AccountDrawer/MiniPortfolio/Activity/CancelOrdersDialog'
import {
  OffchainOrderLineItem,
  OffchainOrderLineItemProps,
  OffchainOrderLineItemType,
} from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainOrderLineItem'
import { useCancelMultipleOrdersCallback } from 'components/AccountDrawer/MiniPortfolio/Activity/utils/cancel'
import { formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import Column, { AutoColumn } from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { LimitDisclaimer } from 'components/swap/LimitDisclaimer'
import { SwapModalHeaderAmount } from 'components/swap/SwapModalHeaderAmount'
import { useCurrency } from 'hooks/Tokens'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { TFunction } from 'i18next'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { deprecatedStyled } from 'lib/styled-components'
import { useCallback, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useUniswapXOrderByOrderHash } from 'state/transactions/hooks'
import { ThemedText } from 'theme/components'
import { Divider } from 'theme/components/Dividers'
import { Button, Flex, TouchableArea, useSporeColors } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { hasTradeType } from 'uniswap/src/features/transactions/swap/utils/trade'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isLimitCancellable } from 'uniswap/src/features/transactions/utils/uniswapX.utils'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'

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

const Wrapper = deprecatedStyled(AutoColumn).attrs({ gap: 'md', grow: true })`
    padding: 12px 20px 20px 20px;
    width: 100%;
    background-color: ${({ theme }) => theme.surface1};
`

const OffchainModalDivider = deprecatedStyled(Divider)`
    margin: 28px 0;
`

const InsufficientFundsCopyContainer = deprecatedStyled(Row)`
    margin-top: 16px;
    padding: 12px;
    border: 1.3px solid ${({ theme }) => theme.surface3};
    border-radius: 20px;
    gap: 12px;
    justify-content: space-between;
    align-items: flex-start;
`

const AlertIconContainer = deprecatedStyled.div`
    display: flex;
    flex-shrink: 0;
    background-color: ${({ theme }) => theme.deprecated_accentWarning};
    width: 40px;
    height: 40px;
    justify-content: center;
    align-items: center;
    border-radius: 12px;
`

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
  const fiatValueInput = useUSDPrice(amounts?.inputAmount)
  const fiatValueOutput = useUSDPrice(amounts?.outputAmount)
  const colors = useSporeColors()

  const explorerLink = order.hash
    ? getExplorerLink({ chainId: order.chainId, data: order.hash, type: ExplorerDataType.TRANSACTION })
    : undefined

  const createdAt = formatTimestamp({ timestamp: order.addedTime })

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
    <Column>
      <Row gap="md">
        <PortfolioLogo chainId={amounts.inputAmount.currency.chainId} currencies={currencies} />
        <Column>
          <ThemedText.SubHeader fontWeight={500}>{orderTitle}</ThemedText.SubHeader>
          <ThemedText.BodySmall color="neutral2" fontWeight={500}>
            {createdAt}
          </ThemedText.BodySmall>
        </Column>
      </Row>
      <OffchainModalDivider />
      <Column gap="md">
        <SwapModalHeaderAmount
          field={CurrencyField.INPUT}
          label={undefined}
          amount={amounts.inputAmount}
          currency={amounts.inputAmount.currency}
          usdAmount={fiatValueInput.data}
          isLoading={false}
          headerTextProps={{ fontSize: '24px', lineHeight: '32px' }}
        />
        <ArrowDown color={colors.neutral3.val} />
        <SwapModalHeaderAmount
          field={CurrencyField.OUTPUT}
          label={undefined}
          amount={amounts.outputAmount}
          currency={amounts.outputAmount.currency}
          usdAmount={fiatValueOutput.data}
          isLoading={false}
          headerTextProps={{ fontSize: '24px', lineHeight: '32px' }}
        />
      </Column>
      <OffchainModalDivider />
      <Column gap="sm">
        {details.map((detail) => (
          <OffchainOrderLineItem key={detail.type} {...detail} />
        ))}
      </Column>
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
          <Column>
            <ThemedText.SubHeader lineHeight="24px">{t('common.insufficientBalance.error')}</ThemedText.SubHeader>
            <ThemedText.SubHeaderSmall lineHeight="20px">
              {order.routing === TradingApi.Routing.DUTCH_LIMIT
                ? t('account.portfolio.activity.signLimit')
                : t('account.portfolio.activity.canceledBelow')}
            </ThemedText.SubHeaderSmall>
          </Column>
        </InsufficientFundsCopyContainer>
      ) : order.routing === TradingApi.Routing.DUTCH_LIMIT ? (
        <LimitDisclaimer />
      ) : null}
    </Column>
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
export function OffchainActivityModal() {
  const { t } = useTranslation()
  const selectedOrderAtomValue = useAtomValue(selectedOrderAtom)
  const [cancelState, setCancelState] = useState(CancellationState.NOT_STARTED)
  const [cancelTxHash, setCancelTxHash] = useState<string | undefined>()

  const syncedSelectedOrder = useSyncedSelectedOrder()
  const setSelectedOrder = useUpdateAtom(selectedOrderAtom)

  const reset = () => {
    setSelectedOrder(undefined)
  }

  const cancelOrders = useCancelMultipleOrdersCallback(syncedSelectedOrder ? [syncedSelectedOrder] : undefined)

  return (
    <>
      {syncedSelectedOrder && selectedOrderAtomValue?.modalOpen && (
        <CancelOrdersDialog
          isVisible={cancelState !== CancellationState.NOT_STARTED}
          orders={[syncedSelectedOrder]}
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
      )}
      <Modal
        name={ModalName.OffchainActivity}
        maxWidth={375}
        isModalOpen={!!selectedOrderAtomValue?.modalOpen && cancelState === CancellationState.NOT_STARTED}
        onClose={reset}
        padding={0}
      >
        <Wrapper data-testid="offchain-activity-modal">
          <Row justify="space-between">
            <ThemedText.SubHeader fontWeight={500}>{t('common.transactionDetails')}</ThemedText.SubHeader>
            <TouchableArea onPress={reset}>
              <X size="$icon.20" color="$neutral1" hoverColor="$neutral1Hovered" />
            </TouchableArea>
          </Row>
          {syncedSelectedOrder && (
            <OrderContent
              order={syncedSelectedOrder}
              onCancel={() => {
                setCancelState(CancellationState.REVIEWING_CANCELLATION)
              }}
            />
          )}
        </Wrapper>
      </Modal>
    </>
  )
}
