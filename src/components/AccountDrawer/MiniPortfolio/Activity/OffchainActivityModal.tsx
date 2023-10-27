import { BigNumber } from '@ethersproject/bignumber'
import { Web3Provider } from '@ethersproject/providers'
import { t, Trans } from '@lingui/macro'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { DutchOrder } from '@uniswap/uniswapx-sdk'
import { useWeb3React } from '@web3-react/core'
import PERMIT2_ABI from 'abis/permit2.json'
import { Permit2 } from 'abis/types'
import { ReactComponent as ErrorContent } from 'assets/svg/uniswapx_error.svg'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Column, { AutoColumn } from 'components/Column'
import { OpacityHoverState } from 'components/Common'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { AnimatedEntranceConfirmationIcon, FadePresence } from 'components/swap/PendingModalContent/Logos'
import { TradeSummary } from 'components/swap/PendingModalContent/TradeSummary'
import { useCurrency } from 'hooks/Tokens'
import { useContract } from 'hooks/useContract'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { UniswapXBackendOrder, UniswapXOrderStatus } from 'lib/hooks/orders/types'
import { useCallback, useMemo } from 'react'
import { X } from 'react-feather'
import { InterfaceTrade } from 'state/routing/types'
import { useOrder } from 'state/signatures/hooks'
import styled from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

function bitmapPositions(nonce: BigNumber) {
  const wordPos = nonce.shr(8)
  const bitPos = nonce.and(0xff)

  return { wordPos: wordPos.toString(), bitPos: bitPos.toString() }
}

type SelectedOrderInfo = {
  modalOpen?: boolean
  order: UniswapXBackendOrder
}

const selectedOrderAtom = atom<SelectedOrderInfo | undefined>(undefined)

export function useOpenOffchainActivityModal() {
  const setSelectedOrder = useUpdateAtom(selectedOrderAtom)

  return useCallback((order: UniswapXBackendOrder) => setSelectedOrder({ order, modalOpen: true }), [setSelectedOrder])
}

const Wrapper = styled(AutoColumn).attrs({ grow: true })`
  padding: 16px;
  position: relative;
`

const ContentContainer = styled(AutoColumn).attrs({ justify: 'center', gap: 'md' })`
  padding: 28px 44px 24px 44px;
`

const LimitOrderContainer = styled(AutoColumn).attrs({ justify: 'center', gap: 'md' })`
  padding: 0px;
`

const StyledXButton = styled(X)`
  cursor: pointer;
  justify-self: flex-end;

  color: ${({ theme }) => theme.neutral1};
  ${OpacityHoverState};
  position: absolute;
  top: 16px;
  right: 16px;
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
  order?: UniswapXBackendOrder
): Pick<InterfaceTrade, 'inputAmount' | 'postTaxOutputAmount'> | undefined {
  const inputCurrency = useCurrency(order?.input.token, order?.chainId)
  const outputCurrency = useCurrency(order?.outputs[0].token, order?.chainId)

  if (!order) return undefined

  if (!inputCurrency || !outputCurrency) {
    console.error(`Could not find token(s) for order ${order.orderHash}`)
    return undefined
  }

  return {
    inputAmount: CurrencyAmount.fromRawAmount(inputCurrency, order.input.endAmount),
    postTaxOutputAmount: CurrencyAmount.fromRawAmount(outputCurrency, order?.outputs[0].endAmount),
  }
}

function cancelOrder(order: UniswapXBackendOrder, permit2: Permit2 | null, provider: Web3Provider | undefined) {
  console.log(order)
  const parsedOrder = DutchOrder.parse(order.encodedOrder, order.chainId)
  const invalidateNonceInput = bitmapPositions(parsedOrder.info.nonce)
  console.log(invalidateNonceInput)
  console.log(permit2)
  console.log(provider)

  if (permit2 && provider) {
    permit2
      // @ts-ignore
      .invalidateUnorderedNonces(invalidateNonceInput.wordPos, invalidateNonceInput.bitPos)
      .then((txn: any) => {
        console.log(txn)
        provider
          .getSigner()
          // @ts-ignore
          .estimateGas(txn)
          .then((estimate) => {
            const newTxn = {
              ...txn,
              gasLimit: calculateGasMargin(estimate),
            }

            return (
              provider
                .getSigner()
                // @ts-ignore
                .sendTransaction(newTxn)
                .then((response) => {
                  console.log(response)
                })
            )
          })
          .catch((error) => {
            console.error('Failed to send transaction', error)
            // we only care if the error is something _other_ than the user rejected the tx
            if (error?.code !== 4001) {
              console.error(error)
            }
          })
      })
      .catch((error: any) => {
        console.log(error)
      })
  }
}

const blah = true

export function OrderContent({ order }: { order: UniswapXBackendOrder }) {
  const amounts = useOrderAmounts(order)
  const permit2 = useContract<Permit2>(PERMIT2_ADDRESS, PERMIT2_ABI)
  const { provider } = useWeb3React()

  const explorerLink = order?.orderHash
    ? getExplorerLink(order?.chainId, order?.orderHash, ExplorerDataType.TRANSACTION)
    : undefined

  if (blah) {
    return (
      <LimitOrderContainer>
        <ThemedText.SubHeaderLarge>
          <Trans>Limit Order</Trans>
        </ThemedText.SubHeaderLarge>
        <Row justify="space-between">
          <Column>
            <ThemedText.LabelSmall>You Pay</ThemedText.LabelSmall>
            <ThemedText.HeadlineLarge>
              {amounts?.inputAmount.toSignificant(6)} {amounts?.inputAmount.currency.symbol}
            </ThemedText.HeadlineLarge>
          </Column>
          <Column>
            <CurrencyLogo currency={amounts?.inputAmount.currency} size="36px" />
          </Column>
        </Row>
        <Row justify="space-between">
          <Column>
            <ThemedText.LabelSmall>You Receive</ThemedText.LabelSmall>
            <ThemedText.HeadlineLarge>
              {amounts?.postTaxOutputAmount.toSignificant(6)} {amounts?.postTaxOutputAmount.currency.symbol}
            </ThemedText.HeadlineLarge>
          </Column>
          <Column>
            <CurrencyLogo currency={amounts?.postTaxOutputAmount.currency} size="36px" />
          </Column>
        </Row>
        <ThemeButton
          style={{ justifySelf: 'stretch' }}
          emphasis={ButtonEmphasis.failure}
          onClick={() => {
            cancelOrder(order, permit2, provider)
          }}
          size={ButtonSize.large}
        >
          Cancel Order
        </ThemeButton>
      </LimitOrderContainer>
    )
  }

  switch (order.orderStatus) {
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

    default:
      return <div />
  }
}

/* Returns the order currently selected in the UI synced with updates from order status polling */
function useSyncedSelectedOrder(): SelectedOrderInfo | undefined {
  const selectedOrder = useAtomValue(selectedOrderAtom)
  const localPendingOrder = useOrder(selectedOrder?.order.orderHash ?? '')

  return useMemo(() => {
    if (!selectedOrder) return undefined

    return {
      ...selectedOrder,
      status: localPendingOrder?.status ?? selectedOrder.order.orderStatus,
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
      <Wrapper data-testid="offchain-activity-modal">
        <StyledXButton onClick={reset} />
        {syncedSelectedOrder && <OrderContent order={syncedSelectedOrder.order} />}
      </Wrapper>
    </Modal>
  )
}
