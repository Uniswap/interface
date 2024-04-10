import { t, Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { OrderContent } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import Column, { ColumnCenter } from 'components/Column'
import Row from 'components/Row'
import { SupportArticleURL } from 'constants/supportArticles'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { SwapResult } from 'hooks/useSwapCallback'
import { useUnmountingAnimation } from 'hooks/useUnmountingAnimation'
import { UniswapXOrderStatus } from 'lib/hooks/orders/types'
import { ReactNode, useMemo, useRef } from 'react'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { useOrder } from 'state/signatures/hooks'
import { useIsTransactionConfirmed, useSwapTransactionStatus } from 'state/transactions/hooks'
import styled, { css } from 'styled-components'
import { ExternalLink } from 'theme/components'
import { AnimationType } from 'theme/components/FadePresence'
import { ThemedText } from 'theme/components/text'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { isLimitTrade } from 'state/routing/utils'
import {
  AnimatedEntranceConfirmationIcon,
  AnimatedEntranceSubmittedIcon,
  LoadingIndicatorOverlay,
  LogoContainer,
} from '../AccountDrawer/MiniPortfolio/Activity/Logos'
import { slideInAnimation, slideOutAnimation } from './animations'
import { TradeSummary } from './TradeSummary'

const Container = styled(ColumnCenter)`
  margin: 48px 0 8px;
`
const HeaderContainer = styled(ColumnCenter)<{ $disabled?: boolean }>`
  ${({ $disabled }) => $disabled && `opacity: 0.5;`}
  padding: 0 32px;
  overflow: visible;
`
const AnimationWrapper = styled.div`
  position: relative;
  width: 100%;
  min-height: 72px;
  display: flex;
  flex-grow: 1;
`
const StepTitleAnimationContainer = styled(Column)<{ disableEntranceAnimation?: boolean }>`
  position: absolute;
  width: 100%;
  height: 100%;
  align-items: center;
  display: flex;
  flex-direction: column;
  transition: display ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
  ${({ disableEntranceAnimation }) =>
    !disableEntranceAnimation &&
    css`
      ${slideInAnimation}
    `}

  &.${AnimationType.EXITING} {
    ${slideOutAnimation}
  }
`

function getTitle({
  trade,
  swapPending,
  swapConfirmed,
}: {
  trade?: InterfaceTrade
  swapPending: boolean
  swapConfirmed: boolean
}): ReactNode {
  if (isLimitTrade(trade)) {
    if (swapPending) return t`Limit submitted`
    if (swapConfirmed) return t`Limit filled!`

    return t`Confirm limit`
  }

  if (swapPending) return t`Swap submitted`
  if (swapConfirmed) return t`Swap success!`

  return t`Confirm swap`
}

export function Pending({
  trade,
  swapResult,
  wrapTxHash,
  tokenApprovalPending = false,
  revocationPending = false,
}: {
  trade?: InterfaceTrade
  swapResult?: SwapResult
  wrapTxHash?: string
  tokenApprovalPending?: boolean
  revocationPending?: boolean
}) {
  // This component is only rendered after the user signs, so we don't want to
  // accept new trades with different quotes. We should only display the quote
  // price that the user actually submitted.
  // TODO(WEB-3854): Stop requesting new swap quotes after the user submits the transaction.
  const initialTrade = useRef(trade).current
  const { chainId } = useWeb3React()

  const swapStatus = useSwapTransactionStatus(swapResult)
  const uniswapXOrder = useOrder(swapResult?.type === TradeFillType.UniswapX ? swapResult.response.orderHash : '')

  const limitPlaced = isLimitTrade(initialTrade) && uniswapXOrder?.status === UniswapXOrderStatus.OPEN
  const swapConfirmed =
    swapStatus === TransactionStatus.Confirmed || uniswapXOrder?.status === UniswapXOrderStatus.FILLED
  const wrapConfirmed = useIsTransactionConfirmed(wrapTxHash)

  const swapPending = swapResult !== undefined && !swapConfirmed
  const wrapPending = wrapTxHash != undefined && !wrapConfirmed
  const transactionPending = revocationPending || tokenApprovalPending || wrapPending || swapPending

  const showSubmitted = swapPending && !swapConfirmed && chainId === ChainId.MAINNET
  const showSuccess = swapConfirmed || (chainId !== ChainId.MAINNET && swapPending)

  const currentStepContainerRef = useRef<HTMLDivElement>(null)
  useUnmountingAnimation(currentStepContainerRef, () => AnimationType.EXITING)

  const explorerLink = useMemo(() => {
    let txHash
    if (swapResult && swapResult.type === TradeFillType.Classic) {
      txHash = swapResult.response.hash
    } else if (uniswapXOrder && uniswapXOrder.status === UniswapXOrderStatus.FILLED) {
      txHash = uniswapXOrder.orderHash
    } else {
      return
    }
    return getExplorerLink(chainId || ChainId.MAINNET, txHash, ExplorerDataType.TRANSACTION)
  }, [chainId, swapResult, uniswapXOrder])

  // Handle special statuses for UniswapX orders
  if (
    uniswapXOrder &&
    uniswapXOrder.status !== UniswapXOrderStatus.OPEN &&
    uniswapXOrder.status !== UniswapXOrderStatus.FILLED
  ) {
    return <OrderContent order={uniswapXOrder} />
  }

  return (
    <Container gap="lg">
      <LogoContainer>
        {/* Shown only during the final step under "success" conditions, and scales in */}
        {showSuccess && <AnimatedEntranceConfirmationIcon />}
        {/* Shown only during the final step on mainnet, when the transaction is sent but pending confirmation */}
        {showSubmitted && <AnimatedEntranceSubmittedIcon />}
        {/* Scales in for any step that waits for an onchain transaction, while the transaction is pending */}
        {/* On the last step, appears while waiting for the transaction to be signed too */}
        {!showSuccess && !showSubmitted && <LoadingIndicatorOverlay />}
      </LogoContainer>
      <HeaderContainer gap="md" $disabled={transactionPending && !limitPlaced}>
        <AnimationWrapper>
          <StepTitleAnimationContainer gap="md" ref={currentStepContainerRef} disableEntranceAnimation>
            <ThemedText.SubHeader width="100%" textAlign="center" data-testid="pending-modal-content-title">
              {getTitle({ trade: initialTrade, swapPending, swapConfirmed })}
            </ThemedText.SubHeader>
            {initialTrade && (
              <ThemedText.LabelSmall textAlign="center">
                <TradeSummary trade={initialTrade} />
              </ThemedText.LabelSmall>
            )}
          </StepTitleAnimationContainer>
        </AnimationWrapper>
        {/* Display while waiting for user to make final submission by confirming in wallet */}
        {!swapPending && !swapConfirmed && (
          <Row justify="center" marginTop="32px" minHeight="24px">
            <ThemedText.BodySmall color="neutral2">{t`Proceed in your wallet`}</ThemedText.BodySmall>
          </Row>
        )}
        {/* Display while UniswapX order is still pending */}
        {uniswapXOrder && uniswapXOrder.status === UniswapXOrderStatus.OPEN && (
          <Row justify="center" marginTop="32px" minHeight="24px">
            <ThemedText.BodySmall color="neutral2">
              <ExternalLink
                href={
                  isLimitTrade(initialTrade)
                    ? SupportArticleURL.LEARN_ABOUT_LIMITS
                    : SupportArticleURL.WHAT_IS_UNISWAP_X
                }
              >
                {isLimitTrade(initialTrade) ? (
                  <Trans>Learn more about limits</Trans>
                ) : (
                  <Trans>Learn more about swapping with UniswapX</Trans>
                )}
              </ExternalLink>
            </ThemedText.BodySmall>
          </Row>
        )}
        {/* Display after submitting Classic swap or after filling UniswapX order */}
        {explorerLink && (
          <Row justify="center" marginTop="32px" minHeight="24px">
            <ThemedText.BodySmall color="neutral2">
              <ExternalLink href={explorerLink} color="neutral2">
                <Trans>View on Explorer</Trans>
              </ExternalLink>
            </ThemedText.BodySmall>
          </Row>
        )}
      </HeaderContainer>
    </Container>
  )
}
