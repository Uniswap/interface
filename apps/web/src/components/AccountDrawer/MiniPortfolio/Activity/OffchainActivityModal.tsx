import { t, Trans } from '@lingui/macro'
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
import styled from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { OffchainOrderDetails } from './types'

type SelectedOrderInfo = {
  modalOpen?: boolean
  order?: OffchainOrderDetails
}

const selectedOrderAtom = atom<SelectedOrderInfo | undefined>(undefined)

export function useOpenOffchainActivityModal() {
  const setSelectedOrder = useUpdateAtom(selectedOrderAtom)

  return useCallback((order: OffchainOrderDetails) => setSelectedOrder({ order, modalOpen: true }), [setSelectedOrder])
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

  color: ${({ theme }) => theme.neutral1};
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
  position: relative;
  margin-bottom: 10px;
`

const LearnMoreLink = styled(ExternalLink)`
  font-weight: 535;
`
const DescriptionText = styled(ThemedText.LabelMicro)`
  text-align: center;
`

function useOrderAmounts(
  order?: OffchainOrderDetails
): Pick<InterfaceTrade, 'inputAmount' | 'outputAmount'> | undefined {
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

export function OrderContent({ order }: { order: OffchainOrderDetails }) {
  const amounts = useOrderAmounts(order)

  const explorerLink = order?.txHash
    ? getExplorerLink(order.chainId, order.txHash, ExplorerDataType.TRANSACTION)
    : undefined

  switch (order.status) {
    case UniswapXOrderStatus.OPEN: {
      return (
        <ContentContainer>
          <Loader />
          <ThemedText.SubHeaderLarge>
            <Trans>Swapping</Trans>
          </ThemedText.SubHeaderLarge>
          <Column>
            {amounts && <TradeSummary trade={amounts} />}
            <ThemedText.BodySmall paddingTop="48px" textAlign="center">
              <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/17515415311501">
                <Trans>Learn more about swapping with UniswapX</Trans>
              </ExternalLink>
            </ThemedText.BodySmall>
          </Column>
        </ContentContainer>
      )
    }
    case UniswapXOrderStatus.FILLED:
      return (
        <ContentContainer>
          <Success />
          <ThemedText.SubHeaderLarge>
            <Trans>Swapped</Trans>
          </ThemedText.SubHeaderLarge>
          <Column>
            {amounts && <TradeSummary trade={amounts} />}
            <ThemedText.BodySmall paddingTop="48px" textAlign="center">
              {explorerLink && (
                <ExternalLink href={explorerLink}>
                  <Trans>View on Explorer</Trans>
                </ExternalLink>
              )}
            </ThemedText.BodySmall>
          </Column>
        </ContentContainer>
      )
    case UniswapXOrderStatus.CANCELLED:
      return (
        <ContentContainer>
          <ErrorContent />
          <ThemedText.SubHeaderLarge>
            <Trans>Cancelled</Trans>
          </ThemedText.SubHeaderLarge>
          <ThemedText.LabelSmall textAlign="center">
            <Trans>This order was cancelled</Trans>
          </ThemedText.LabelSmall>
        </ContentContainer>
      )
    case UniswapXOrderStatus.EXPIRED:
      return (
        <ContentContainer>
          <ErrorContent />
          <ThemedText.SubHeaderLarge>
            <Trans>Swap expired</Trans>
          </ThemedText.SubHeaderLarge>
          <DescriptionText>
            {/* TODO: Improve translation grammar by not having to break up the string */}
            <Trans>Your swap expired before it could be filled. Try again or</Trans>{' '}
            <LearnMoreLink href="https://support.uniswap.org/hc/en-us/articles/17515426867213">
              <Trans>learn more.</Trans>
            </LearnMoreLink>
          </DescriptionText>
        </ContentContainer>
      )
    case UniswapXOrderStatus.ERROR:
      return (
        <ContentContainer>
          <ErrorContent />
          <ThemedText.SubHeaderLarge>
            <Trans>Error</Trans>
          </ThemedText.SubHeaderLarge>
          <ThemedText.LabelSmall textAlign="center">
            {/* TODO: Improve translation grammar by not having to break up the string */}
            <Trans>Your swap couldn&apos;t be filled at this time. Try again or </Trans>{' '}
            <LearnMoreLink href="https://support.uniswap.org/hc/en-us/articles/17515489874189">
              <Trans>learn more.</Trans>
            </LearnMoreLink>
          </ThemedText.LabelSmall>
        </ContentContainer>
      )
    case UniswapXOrderStatus.INSUFFICIENT_FUNDS:
      return (
        <ContentContainer>
          <ErrorContent />
          <ThemedText.SubHeaderLarge>
            <Trans>Insufficient funds for swap</Trans>
          </ThemedText.SubHeaderLarge>
          <ThemedText.LabelSmall textAlign="center">{t`You didn't have enough ${
            amounts?.inputAmount.currency.symbol ?? amounts?.inputAmount.currency.name ?? t`of the input token`
          } to complete this swap.`}</ThemedText.LabelSmall>
        </ContentContainer>
      )
  }
}

/* Returns the order currently selected in the UI synced with updates from order status polling */
function useSyncedSelectedOrder(): OffchainOrderDetails | undefined {
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
 * Because of this, we try to converge the different cases into one type, OffchainOrderDetails,
 * which can be passed around within the Activity in the case of remote records.
 */
export function OffchainActivityModal() {
  const selectedOrderAtomValue = useAtomValue(selectedOrderAtom)

  const syncedSelectedOrder = useSyncedSelectedOrder()
  const setSelectedOrder = useUpdateAtom(selectedOrderAtom)

  const reset = useCallback(() => {
    setSelectedOrder((order) => order && { ...order, modalOpen: false })
  }, [setSelectedOrder])

  return (
    <Modal isOpen={!!selectedOrderAtomValue?.modalOpen} onDismiss={reset}>
      <Wrapper data-testid="offchain-activity-modal">
        <StyledXButton onClick={reset} />
        {syncedSelectedOrder && <OrderContent order={syncedSelectedOrder} />}
      </Wrapper>
    </Modal>
  )
}
