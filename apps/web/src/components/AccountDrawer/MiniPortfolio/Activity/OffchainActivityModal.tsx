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
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button/buttons'
import { OpacityHoverState } from 'components/Common/styles'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import Column, { AutoColumn } from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { LimitDisclaimer } from 'components/swap/LimitDisclaimer'
import { SwapModalHeaderAmount } from 'components/swap/SwapModalHeaderAmount'
import { useCurrency } from 'hooks/Tokens'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import styled, { useTheme } from 'lib/styled-components'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { ArrowDown, X } from 'react-feather'
import { Trans } from 'react-i18next'
import { useOrder } from 'state/signatures/hooks'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { Divider, ThemedText } from 'theme/components'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventNameLocal, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyField } from 'uniswap/src/types/currency'
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
      sendAnalyticsEvent(InterfaceEventNameLocal.UniswapXOrderDetailsSheetOpened, {
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

const StyledXButton = styled(X)`
  cursor: pointer;
  justify-self: flex-end;

  color: ${({ theme }) => theme.neutral1};
  ${OpacityHoverState};
`

const OffchainModalDivider = styled(Divider)`
  margin: 28px 0;
`

const OffchainModalBottomButton = styled(ThemeButton)`
  margin-top: 16px;
  border-radius: 12px;
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
  const inputCurrency = useCurrency(order?.swapInfo?.inputCurrencyId || 'ETH', order?.chainId)
  const outputCurrency = useCurrency(order?.swapInfo?.outputCurrencyId || 'ETH', order?.chainId)

  if (!order || !order?.swapInfo) {
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

function getOrderTitle(order: UniswapXOrderDetails): ReactNode {
  const isLimit = order.type === SignatureType.SIGN_LIMIT
  switch (order.status) {
    case UniswapXOrderStatus.OPEN:
      return isLimit ? <Trans i18nKey="common.limit.pending" /> : <Trans i18nKey="common.orderPending" />
    case UniswapXOrderStatus.EXPIRED:
      return isLimit ? <Trans i18nKey="common.limit.expired" /> : <Trans i18nKey="common.orderExpired" />
    case UniswapXOrderStatus.PENDING_CANCELLATION:
      return <Trans i18nKey="common.pending.cancellation" />
    case UniswapXOrderStatus.INSUFFICIENT_FUNDS:
      return <Trans i18nKey="common.insufficient.funds" />
    case UniswapXOrderStatus.CANCELLED:
      return isLimit ? <Trans i18nKey="common.limit.cancelled" /> : <Trans i18nKey="common.orderCancelled" />
    case UniswapXOrderStatus.FILLED:
      return isLimit ? <Trans i18nKey="common.limit.executed" /> : <Trans i18nKey="common.orderExecuted" />
    default:
      return null
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
  const amounts = useOrderAmounts(order)
  const amountsDefined = !!amounts?.inputAmount?.currency && !!amounts?.outputAmount?.currency
  const fiatValueInput = useUSDPrice(amounts?.inputAmount)
  const fiatValueOutput = useUSDPrice(amounts?.outputAmount)
  const theme = useTheme()

  const explorerLink = order?.txHash
    ? getExplorerLink(order.chainId, order.txHash, ExplorerDataType.TRANSACTION)
    : undefined

  const createdAt = formatTimestamp(order.addedTime)

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

  if (!amounts?.inputAmount || !amounts?.outputAmount) {
    return null
  }

  return (
    <Column>
      <Row gap="md">
        <PortfolioLogo
          chainId={amounts?.inputAmount.currency.chainId ?? UniverseChainId.Mainnet}
          currencies={currencies}
        />
        <Column>
          <ThemedText.SubHeader fontWeight={500}>{getOrderTitle(order)}</ThemedText.SubHeader>
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
        <OffchainModalBottomButton emphasis={ButtonEmphasis.medium} onClick={onCancel} size={ButtonSize.medium}>
          {order.type === SignatureType.SIGN_LIMIT ? (
            <Trans i18nKey="common.limit.cancel" count={1} />
          ) : (
            <Trans i18nKey="common.cancelOrder" />
          )}
        </OffchainModalBottomButton>
      )}
      {order.status === UniswapXOrderStatus.INSUFFICIENT_FUNDS ? (
        <InsufficientFundsCopyContainer>
          <AlertIconContainer>
            <AlertTriangleFilled size="20px" />
          </AlertIconContainer>
          <Column>
            <ThemedText.SubHeader lineHeight="24px">
              <Trans i18nKey="common.insufficientBalance.error" />
            </ThemedText.SubHeader>
            <ThemedText.SubHeaderSmall lineHeight="20px">
              {order.type === SignatureType.SIGN_LIMIT ? (
                <Trans i18nKey="account.portfolio.activity.signLimit" />
              ) : (
                <Trans i18nKey="account.porfolio.activity.cancelledBelow" />
              )}
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
  const selectedOrderAtomValue = useAtomValue(selectedOrderAtom)
  const [cancelState, setCancelState] = useState(CancellationState.NOT_STARTED)
  const [cancelTxHash, setCancelTxHash] = useState<string | undefined>()

  const syncedSelectedOrder = useSyncedSelectedOrder()
  const setSelectedOrder = useUpdateAtom(selectedOrderAtom)

  const reset = useCallback(() => {
    setSelectedOrder((order) => order && { ...order, modalOpen: false })
  }, [setSelectedOrder])

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
            <ThemedText.SubHeader fontWeight={500}>
              <Trans i18nKey="common.transactionDetails" />
            </ThemedText.SubHeader>
            <StyledXButton onClick={reset} />
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
