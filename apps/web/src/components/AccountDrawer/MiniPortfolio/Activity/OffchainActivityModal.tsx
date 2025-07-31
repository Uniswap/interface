import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import {
  CancelOrdersDialog,
  CancellationState,
} from 'components/AccountDrawer/MiniPortfolio/Activity/CancelOrdersDialog'
import {
  OffchainOrderLineItem,
  OffchainOrderLineItemProps,
  OffchainOrderLineItemType,
} from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainOrderLineItem'
import {
  isLimitCancellable,
  useCancelMultipleOrdersCallback,
} from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import Column, { AutoColumn } from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { LimitDisclaimer } from 'components/swap/LimitDisclaimer'
import { SwapModalHeaderAmount } from 'components/swap/SwapModalHeaderAmount'
import { useCurrency } from 'hooks/Tokens'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { TFunction } from 'i18next'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import styled, { useTheme } from 'lib/styled-components'
import { useCallback, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useOrder } from 'state/signatures/hooks'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { ThemedText } from 'theme/components'
import { Divider } from 'theme/components/Dividers'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { Button, Flex, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'

type Logos = {
  inputLogo?: string
  outputLogo?: string
}

type SelectedOrderInfo = {
  modalOpen?: boolean
  order?: UniswapXOrderDetails
  logos?: Logos
}

const selectedOrderAtom = atom<SelectedOrderInfo | undefined>(undefined)

export function useOpenOffchainActivityModal() {
  const setSelectedOrder = useUpdateAtom(selectedOrderAtom)

  return useCallback(
    (order: UniswapXOrderDetails, logos?: Logos) => {
      sendAnalyticsEvent(InterfaceEventName.UniswapXOrderDetailsSheetOpened, {
        order: order.orderHash,
      })
      setSelectedOrder({ order, logos, modalOpen: true })
    },
    [setSelectedOrder],
  )
}

const Wrapper = styled(AutoColumn).attrs({ gap: 'md', grow: true })`
  padding: 12px 20px 20px 20px;
  width: 100%;
  background-color: ${({ theme }) => theme.surface1};
`

const OffchainModalDivider = styled(Divider)`
  margin: 28px 0;
`

const InsufficientFundsCopyContainer = styled(Row)`
  margin-top: 16px;
  padding: 12px;
  border: 1.3px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  gap: 12px;
  justify-content: space-between;
  align-items: flex-start;
`

const AlertIconContainer = styled.div`
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
  const inputCurrency = useCurrency({
    address: order ? currencyIdToAddress(order.swapInfo.inputCurrencyId) : undefined,
    chainId: order?.chainId,
  })
  const outputCurrency = useCurrency({
    address: order ? currencyIdToAddress(order.swapInfo.outputCurrencyId) : undefined,
    chainId: order?.chainId,
  })

  if (!order) {
    return undefined
  }

  if (!inputCurrency || !outputCurrency) {
    logger.warn('OffchainActivityModal', 'useOrderAmounts', 'Could not find token(s) for order', {
      txHash: order.txHash,
    })
    return undefined
  }

  const { swapInfo } = order

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
  orderType,
  orderStatus,
  t,
}: {
  orderType: SignatureType | undefined
  orderStatus: UniswapXOrderStatus
  t: TFunction
}): string {
  const isLimit = orderType === SignatureType.SIGN_LIMIT
  switch (orderStatus) {
    case UniswapXOrderStatus.OPEN:
      return isLimit ? t('common.limit.pending') : t('common.orderPending')
    case UniswapXOrderStatus.EXPIRED:
      return isLimit ? t('common.limit.expired') : t('common.orderExpired')
    case UniswapXOrderStatus.PENDING_CANCELLATION:
      return t('common.pending.cancellation')
    case UniswapXOrderStatus.INSUFFICIENT_FUNDS:
      return t('common.insufficient.funds')
    case UniswapXOrderStatus.CANCELLED:
      return isLimit ? t('common.limit.canceled') : t('common.orderCanceled')
    case UniswapXOrderStatus.FILLED:
      return isLimit ? t('common.limit.executed') : t('common.orderExecuted')
    default:
      return ''
  }
}

export function OrderContent({
  order,
  onCancel,
}: {
  order: UniswapXOrderDetails
  logos?: Logos
  onCancel?: () => void
}) {
  const { t } = useTranslation()
  const amounts = useOrderAmounts(order)
  const amountsDefined = !!amounts?.inputAmount.currency && !!amounts.outputAmount.currency
  const fiatValueInput = useUSDPrice(amounts?.inputAmount)
  const fiatValueOutput = useUSDPrice(amounts?.outputAmount)
  const theme = useTheme()

  const explorerLink = order.txHash
    ? getExplorerLink({ chainId: order.chainId, data: order.txHash, type: ExplorerDataType.TRANSACTION })
    : undefined

  const createdAt = formatTimestamp({ timestamp: order.addedTime })

  const details: Array<OffchainOrderLineItemProps> = useMemo(() => {
    const details = []
    if (amountsDefined) {
      details.push({ type: OffchainOrderLineItemType.EXCHANGE_RATE, amounts } as OffchainOrderLineItemProps)
    }
    if (order.status === UniswapXOrderStatus.OPEN) {
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
    () => getOrderTitle({ orderType: order.type, orderStatus: order.status, t }),
    [order.type, order.status, t],
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
        <ArrowDown color={theme.neutral3} />
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
      {Boolean(isLimitCancellable(order) && order.encodedOrder) && (
        <Flex mt="$spacing12" row>
          <Button size="small" variant="default" emphasis="secondary" onPress={onCancel}>
            {order.type === SignatureType.SIGN_LIMIT ? t('common.limit.cancel', { count: 1 }) : t('common.cancelOrder')}
          </Button>
        </Flex>
      )}
      {order.status === UniswapXOrderStatus.INSUFFICIENT_FUNDS ? (
        <InsufficientFundsCopyContainer>
          <AlertIconContainer>
            <AlertTriangleFilled size="20px" />
          </AlertIconContainer>
          <Column>
            <ThemedText.SubHeader lineHeight="24px">{t('common.insufficientBalance.error')}</ThemedText.SubHeader>
            <ThemedText.SubHeaderSmall lineHeight="20px">
              {order.type === SignatureType.SIGN_LIMIT
                ? t('account.portfolio.activity.signLimit')
                : t('account.portfolio.activity.canceledBelow')}
            </ThemedText.SubHeaderSmall>
          </Column>
        </InsufficientFundsCopyContainer>
      ) : order.type === SignatureType.SIGN_LIMIT ? (
        <LimitDisclaimer />
      ) : null}
    </Column>
  )
}

/* Returns the order currently selected in the UI synced with updates from order status polling */
function useSyncedSelectedOrder(): UniswapXOrderDetails | undefined {
  const selectedOrder = useAtomValue(selectedOrderAtom)
  const localPendingOrder = useOrder(selectedOrder?.order?.orderHash ?? '')

  return useMemo(() => {
    if (!selectedOrder?.order) {
      return undefined
    }

    if (selectedOrder.order.status === UniswapXOrderStatus.FILLED) {
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

  const cancelOrder = useCancelMultipleOrdersCallback(
    useMemo(() => [syncedSelectedOrder].filter(Boolean) as Array<UniswapXOrderDetails>, [syncedSelectedOrder]),
  )

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
            const transactions = await cancelOrder()
            if (transactions && transactions.length > 0) {
              setCancelState(CancellationState.PENDING_CONFIRMATION)
              setCancelTxHash(transactions[0].hash)
              try {
                await transactions[0].wait(1)
              } catch {
                setCancelState(CancellationState.REVIEWING_CANCELLATION)
              }
              setCancelState(CancellationState.CANCELLED)
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
              logos={selectedOrderAtomValue?.logos}
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
