import { t } from '@lingui/macro'
import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { ReactComponent as ErrorContent } from 'assets/svg/uniswapx_error.svg'
import Column, { AutoColumn } from 'components/Column'
import { OpacityHoverState } from 'components/Common'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import Modal from 'components/Modal'
import { AnimatedEntranceConfirmationIcon, FadePresence } from 'components/swap/PendingModalContent/Logos'
import { TradeSummary } from 'components/swap/PendingModalContent/TradeSummary'
import { useCurrency } from 'hooks/Tokens'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { UniswapXOrderStatus } from 'lib/hooks/orders/types'
import { useCallback, useMemo } from 'react'
import { X } from 'react-feather'
import { InterfaceTrade } from 'state/routing/types'
import { useOrder } from 'state/signatures/hooks'
import { UniswapXOrderDetails } from 'state/signatures/types'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

type SelectedOrderInfo = {
  modalOpen?: boolean
  orderHash: string
  status: UniswapXOrderStatus
  details?: UniswapXOrderDetails
}

const selectedOrderAtom = atom<SelectedOrderInfo | undefined>(undefined)

export function useOpenOffchainActivityModal() {
  const setSelectedOrder = useUpdateAtom(selectedOrderAtom)

  return useCallback(
    (order: { orderHash: string; status: UniswapXOrderStatus }) => setSelectedOrder({ ...order, modalOpen: true }),
    [setSelectedOrder]
  )
}

const Wrapper = styled(AutoColumn).attrs({ gap: 'md', grow: true })`
  padding: 16px;
`

const ContentContainer = styled(AutoColumn).attrs({ justify: 'center', gap: 'md' })`
  padding: 28px 44px 24px 44px;
`

const StyledXButton = styled(X)`
  cursor: pointer;
  justify-self: flex-end;

  color: ${({ theme }) => theme.textPrimary};
  ${OpacityHoverState};
`

const LoadingWrapper = styled.div`
  width: 52px;
  height: 52px;
  position: relative;
  margin-bottom: 8px;
`
const LoadingIndicator = styled(LoaderV3)`
  width: 100%;
  height: 100%;
  position: absolute;
`

function Loader() {
  return (
    <LoadingWrapper>
      <FadePresence>
        <LoadingIndicator />
      </FadePresence>
    </LoadingWrapper>
  )
}

const Success = styled(AnimatedEntranceConfirmationIcon)`
  margin-bottom: 10px;
`

const LearnMoreLink = styled(ExternalLink)`
  font-weight: 600;
`
const DescriptionText = styled(ThemedText.LabelMicro)`
  text-align: center;
`

function useOrderAmounts(
  orderDetails?: UniswapXOrderDetails
): Pick<InterfaceTrade, 'inputAmount' | 'outputAmount'> | undefined {
  const inputCurrency = useCurrency(orderDetails?.swapInfo?.inputCurrencyId, orderDetails?.chainId)
  const outputCurrency = useCurrency(orderDetails?.swapInfo?.outputCurrencyId, orderDetails?.chainId)

  if (!orderDetails) return undefined

  if (!inputCurrency || !outputCurrency) {
    console.error(`Could not find token(s) for order ${orderDetails.orderHash}`)
    return undefined
  }

  const { swapInfo } = orderDetails

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

export function OrderContent({ order }: { order: SelectedOrderInfo }) {
  const amounts = useOrderAmounts(order.details)

  const explorerLink = order?.details?.txHash
    ? getExplorerLink(order.details.chainId, order.details.txHash, ExplorerDataType.TRANSACTION)
    : undefined

  switch (order.status) {
    case UniswapXOrderStatus.OPEN: {
      return (
        <ContentContainer>
          <Loader />
          <ThemedText.SubHeaderLarge>{t`Swapping`}</ThemedText.SubHeaderLarge>
          <Column>
            {amounts && <TradeSummary trade={amounts} />}
            <ThemedText.Caption paddingTop="48px" textAlign="center">
              <ExternalLink href="https://google.com">{t`Learn more about swapping with UniswapX`}</ExternalLink>
            </ThemedText.Caption>
          </Column>
        </ContentContainer>
      )
    }
    case UniswapXOrderStatus.FILLED:
      return (
        <ContentContainer>
          <Success />
          <ThemedText.SubHeaderLarge>{t`Swapped`}</ThemedText.SubHeaderLarge>
          <Column>
            {amounts && <TradeSummary trade={amounts} />}
            <ThemedText.Caption paddingTop="48px" textAlign="center">
              {explorerLink && <ExternalLink href={explorerLink}>{t`View on Explorer`}</ExternalLink>}
            </ThemedText.Caption>
          </Column>
        </ContentContainer>
      )
    case UniswapXOrderStatus.CANCELLED:
      return (
        <ContentContainer>
          <ErrorContent />
          <ThemedText.SubHeaderLarge>{t`Cancelled`}</ThemedText.SubHeaderLarge>
          <ThemedText.LabelSmall textAlign="center">{t`This order was cancelled`}</ThemedText.LabelSmall>
        </ContentContainer>
      )
    case UniswapXOrderStatus.EXPIRED:
      return (
        <ContentContainer>
          <ErrorContent />
          <ThemedText.SubHeaderLarge>{t`Swap expired`}</ThemedText.SubHeaderLarge>
          <DescriptionText>
            {t`Your swap expired before it could be filled. Try again or`}{' '}
            <LearnMoreLink href="https://google.com">{t` learn more`}.</LearnMoreLink>
          </DescriptionText>
        </ContentContainer>
      )
    case UniswapXOrderStatus.ERROR:
      return (
        <ContentContainer>
          <ErrorContent />
          <ThemedText.SubHeaderLarge>{t`Error`}</ThemedText.SubHeaderLarge>
          <ThemedText.LabelSmall textAlign="center">
            {t`Your swap couldn't be filled at this time. Try again or `}{' '}
            <LearnMoreLink href="https://google.com">{t` learn more`}.</LearnMoreLink>
          </ThemedText.LabelSmall>
        </ContentContainer>
      )
    case UniswapXOrderStatus.INSUFFICIENT_FUNDS:
      return (
        <ContentContainer>
          <ErrorContent />
          <ThemedText.SubHeaderLarge>{t`Insufficient funds for swap`}</ThemedText.SubHeaderLarge>
          <ThemedText.LabelSmall textAlign="center">{t`You didn't have enough ${
            amounts?.inputAmount.currency.symbol ?? amounts?.inputAmount.currency.name ?? t`of the input token`
          } to complete this swap.`}</ThemedText.LabelSmall>
        </ContentContainer>
      )
  }
}

/* Returns the order currently selected in the UI synced with updates from order status polling */
function useSyncedSelectedOrder(): SelectedOrderInfo | undefined {
  const selectedOrder = useAtomValue(selectedOrderAtom)
  const localPendingOrder = useOrder(selectedOrder?.orderHash ?? '')

  return useMemo(() => {
    if (!selectedOrder) return undefined

    return {
      ...selectedOrder,
      status: localPendingOrder?.status ?? selectedOrder.status,
      details: localPendingOrder,
    }
  }, [localPendingOrder, selectedOrder])
}

export function OffchainActivityModal() {
  const syncedSelectedOrder = useSyncedSelectedOrder()
  const setSelectedOrder = useUpdateAtom(selectedOrderAtom)

  const reset = useCallback(() => {
    setSelectedOrder((order) => order && { ...order, modalOpen: false })
  }, [setSelectedOrder])

  return (
    <Modal isOpen={!!syncedSelectedOrder?.modalOpen} onDismiss={reset}>
      <Wrapper>
        <StyledXButton onClick={reset} />
        {syncedSelectedOrder && <OrderContent order={syncedSelectedOrder} />}
      </Wrapper>
    </Modal>
  )
}
