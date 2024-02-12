import { Trans } from '@lingui/macro'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { ChainId, Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Column, { AutoColumn } from 'components/Column'
import { OpacityHoverState } from 'components/Common'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { Field } from 'components/swap/constants'
import { SwapModalHeaderAmount } from 'components/swap/SwapModalHeaderAmount'
import { ContractTransaction } from 'ethers/lib/ethers'
import { useCurrency } from 'hooks/Tokens'
import { useContract } from 'hooks/useContract'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { UniswapXOrderStatus } from 'lib/hooks/orders/types'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { ArrowDown, X } from 'react-feather'
import { useOrder } from 'state/signatures/hooks'
import { UniswapXOrderDetails } from 'state/signatures/types'
import styled, { useTheme } from 'styled-components'
import { Divider, ThemedText } from 'theme/components'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'
import PERMIT2_ABI from 'wallet/src/abis/permit2.json'
import { Permit2 } from 'wallet/src/abis/types'

import { PortfolioLogo } from '../PortfolioLogo'
import { OffchainOrderLineItem, OffchainOrderLineItemProps, OffchainOrderLineItemType } from './OffchainOrderLineItem'
import { cancelUniswapXOrder } from './utils'

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
    (order: UniswapXOrderDetails, logos?: Logos) => setSelectedOrder({ order, logos, modalOpen: true }),
    [setSelectedOrder]
  )
}

const Wrapper = styled(AutoColumn).attrs({ gap: 'md', grow: true })`
  padding: 12px 20px;
  width: 100%;
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
`

function useOrderAmounts(order?: UniswapXOrderDetails):
  | {
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }
  | undefined {
  const inputCurrency = useCurrency(order?.swapInfo?.inputCurrencyId, order?.chainId)
  const outputCurrency = useCurrency(order?.swapInfo?.outputCurrencyId, order?.chainId)

  if (!order || !order?.swapInfo) return undefined

  if (!inputCurrency || !outputCurrency) {
    console.error(`Could not find token(s) for order ${order.txHash}`)
    return undefined
  }

  const { swapInfo } = order

  if (swapInfo.tradeType === TradeType.EXACT_INPUT) {
    return {
      inputAmount: CurrencyAmount.fromRawAmount(inputCurrency, swapInfo.inputCurrencyAmountRaw),
      outputAmount: CurrencyAmount.fromRawAmount(
        outputCurrency,
        swapInfo.settledOutputCurrencyAmountRaw ?? swapInfo.expectedOutputCurrencyAmountRaw
      ),
    }
  } else {
    return {
      inputAmount: CurrencyAmount.fromRawAmount(inputCurrency, swapInfo.expectedInputCurrencyAmountRaw),
      outputAmount: CurrencyAmount.fromRawAmount(outputCurrency, swapInfo.outputCurrencyAmountRaw),
    }
  }
}

function getOrderTitle(status: UniswapXOrderStatus): ReactNode {
  switch (status) {
    case UniswapXOrderStatus.OPEN:
      return <Trans>Order pending</Trans>
    case UniswapXOrderStatus.EXPIRED:
      return <Trans>Order expired</Trans>
    case UniswapXOrderStatus.CANCELLED:
      return <Trans>Order cancelled</Trans>
    case UniswapXOrderStatus.FILLED:
      return <Trans>Order executed</Trans>
    default:
      return null
  }
}

function useCancelOrder(order: UniswapXOrderDetails): (() => Promise<ContractTransaction | undefined>) | undefined {
  const { provider } = useWeb3React()
  const permit2 = useContract<Permit2>(PERMIT2_ADDRESS, PERMIT2_ABI, true)
  const cancelOrder = useCallback(async () => {
    return await cancelUniswapXOrder({
      encodedOrder: order.encodedOrder as string,
      chainId: order.chainId,
      provider,
      permit2,
    })
  }, [order.chainId, order.encodedOrder, permit2, provider])
  return permit2 && provider ? cancelOrder : undefined
}

export function OrderContent({
  order,
  logos,
  onCloseModal,
}: {
  order: UniswapXOrderDetails
  logos?: Logos
  onCloseModal?: () => void
}) {
  const amounts = useOrderAmounts(order)
  const amountsDefined = !!amounts?.inputAmount?.currency && !!amounts?.outputAmount?.currency
  const fiatValueInput = useUSDPrice(amounts?.inputAmount)
  const fiatValueOutput = useUSDPrice(amounts?.outputAmount)
  const theme = useTheme()
  const cancelOrder = useCancelOrder(order)
  const [cancelling, setCancelling] = useState(false)

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
    [amounts?.inputAmount.currency, amounts?.outputAmount.currency]
  )

  if (!amounts?.inputAmount || !amounts?.outputAmount) {
    return null
  }
  return (
    <Column>
      <Row gap="md">
        <PortfolioLogo
          chainId={amounts?.inputAmount.currency.chainId ?? ChainId.MAINNET}
          currencies={currencies}
          images={[logos?.inputLogo, logos?.outputLogo]}
        />
        <Column>
          <ThemedText.SubHeader fontWeight={500}>{getOrderTitle(order.status)}</ThemedText.SubHeader>
          <ThemedText.BodySmall color="neutral2" fontWeight={500}>
            {createdAt}
          </ThemedText.BodySmall>
        </Column>
      </Row>
      <OffchainModalDivider />
      <Column gap="md">
        <SwapModalHeaderAmount
          field={Field.INPUT}
          label={undefined}
          amount={amounts.inputAmount}
          currency={amounts.inputAmount.currency}
          usdAmount={fiatValueInput.data}
          isLoading={false}
        />
        <ArrowDown color={theme.neutral3} />
        <SwapModalHeaderAmount
          field={Field.OUTPUT}
          label={undefined}
          amount={amounts.outputAmount}
          currency={amounts.outputAmount.currency}
          usdAmount={fiatValueOutput.data}
          isLoading={false}
        />
      </Column>
      <OffchainModalDivider />
      <Column gap="sm">
        {details.map((detail) => (
          <OffchainOrderLineItem key={detail.type} {...detail} />
        ))}
      </Column>
      {order.status === UniswapXOrderStatus.OPEN && order.encodedOrder && cancelOrder && (
        <OffchainModalBottomButton
          emphasis={ButtonEmphasis.failure}
          onClick={async () => {
            setCancelling(true)
            const result = await cancelOrder()
            if (result?.hash) {
              onCloseModal?.()
            }
            setCancelling(false)
          }}
          size={ButtonSize.large}
        >
          {cancelling ? <Trans>Cancelling...</Trans> : <Trans>Cancel</Trans>}
        </OffchainModalBottomButton>
      )}
    </Column>
  )
}

/* Returns the order currently selected in the UI synced with updates from order status polling */
function useSyncedSelectedOrder(): UniswapXOrderDetails | undefined {
  const selectedOrder = useAtomValue(selectedOrderAtom)
  const localPendingOrder = useOrder(selectedOrder?.order?.txHash ?? '')

  return useMemo(() => {
    if (!selectedOrder?.order) return undefined

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

  const syncedSelectedOrder = useSyncedSelectedOrder()
  const setSelectedOrder = useUpdateAtom(selectedOrderAtom)

  const reset = useCallback(() => {
    setSelectedOrder((order) => order && { ...order, modalOpen: false })
  }, [setSelectedOrder])

  return (
    <Modal maxWidth={375} isOpen={!!selectedOrderAtomValue?.modalOpen} onDismiss={reset}>
      <Wrapper data-testid="offchain-activity-modal">
        <Row justify="space-between">
          <ThemedText.SubHeader fontWeight={500}>
            <Trans>Transaction details</Trans>
          </ThemedText.SubHeader>
          <StyledXButton onClick={reset} />
        </Row>
        {syncedSelectedOrder && (
          <OrderContent order={syncedSelectedOrder} logos={selectedOrderAtomValue?.logos} onCloseModal={reset} />
        )}
      </Wrapper>
    </Modal>
  )
}
