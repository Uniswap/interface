import {
  AnimatedEntranceConfirmationIcon,
  AnimatedEntranceSubmittedIcon,
  LoadingIndicatorOverlay,
  LogoContainer,
} from 'components/AccountDrawer/MiniPortfolio/Activity/Logos'
import { OrderContent } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import { slideInAnimation, slideOutAnimation } from 'components/ConfirmSwapModal/animations'
import { TradeSummary } from 'components/ConfirmSwapModal/TradeSummary'
import Column, { ColumnCenter } from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useAccount } from 'hooks/useAccount'
import { SwapResult, useSwapTransactionStatus } from 'hooks/useSwapCallback'
import { useUnmountingAnimation } from 'hooks/useUnmountingAnimation'
import { TFunction } from 'i18next'
import styled, { css } from 'lib/styled-components'
import { ReactNode, useMemo, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { isLimitTrade, isUniswapXTradeType } from 'state/routing/utils'
import { useIsTransactionConfirmed, useUniswapXOrderByOrderHash } from 'state/transactions/hooks'
import { AnimationType } from 'theme/components/FadePresence'
import { ExternalLink } from 'theme/components/Links'
import { ThemedText } from 'theme/components/text'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

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
  t,
  trade,
  swapPending,
  swapConfirmed,
}: {
  t: TFunction
  trade?: InterfaceTrade
  swapPending: boolean
  swapConfirmed: boolean
}): ReactNode {
  if (isLimitTrade(trade)) {
    if (swapPending) {
      return t('swap.limitSubmitted')
    }
    if (swapConfirmed) {
      return t('swap.limitFilled')
    }

    return t('swap.confirmLimit')
  }

  if (swapPending) {
    return t('swap.submitted')
  }
  if (swapConfirmed) {
    return t('swap.success')
  }

  return t('swap.confirmSwap')
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
  const { chainId } = useAccount()
  const { t } = useTranslation()

  const swapStatus = useSwapTransactionStatus(swapResult)
  const uniswapXOrder = useUniswapXOrderByOrderHash(
    isUniswapXTradeType(swapResult?.type) ? swapResult.response.orderHash : '',
  )

  const limitPlaced = isLimitTrade(initialTrade) && uniswapXOrder?.status === TransactionStatus.Pending
  const swapConfirmed = swapStatus === TransactionStatus.Success || uniswapXOrder?.status === TransactionStatus.Success
  const wrapConfirmed = useIsTransactionConfirmed(wrapTxHash)

  const swapPending = swapResult !== undefined && !swapConfirmed
  const wrapPending = wrapTxHash !== undefined && !wrapConfirmed
  const transactionPending = revocationPending || tokenApprovalPending || wrapPending || swapPending

  const showSubmitted = swapPending && chainId === UniverseChainId.Mainnet
  const showSuccess = swapConfirmed || (chainId !== UniverseChainId.Mainnet && swapPending)

  const currentStepContainerRef = useRef<HTMLDivElement>(null)
  useUnmountingAnimation({ node: currentStepContainerRef, getAnimatingClass: () => AnimationType.EXITING })

  const explorerLink = useMemo(() => {
    let txHash
    if (swapResult && swapResult.type === TradeFillType.Classic) {
      txHash = swapResult.response.hash
    } else if (uniswapXOrder && uniswapXOrder.status === TransactionStatus.Success) {
      txHash = uniswapXOrder.hash
    } else {
      return undefined
    }
    return getExplorerLink({
      chainId: chainId || UniverseChainId.Mainnet,
      data: txHash,
      type: ExplorerDataType.TRANSACTION,
    })
  }, [chainId, swapResult, uniswapXOrder])

  // Handle special statuses for UniswapX orders
  if (
    uniswapXOrder &&
    uniswapXOrder.status !== TransactionStatus.Pending &&
    uniswapXOrder.status !== TransactionStatus.Success
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
              {getTitle({ t, trade: initialTrade, swapPending, swapConfirmed })}
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
            <ThemedText.BodySmall color="neutral2">{t('common.proceedInWallet')}</ThemedText.BodySmall>
          </Row>
        )}
        {/* Display while UniswapX order is still pending */}
        {uniswapXOrder && uniswapXOrder.status === TransactionStatus.Pending && (
          <Row justify="center" marginTop="32px" minHeight="24px">
            <ThemedText.BodySmall color="neutral2">
              <ExternalLink
                href={
                  isLimitTrade(initialTrade)
                    ? uniswapUrls.helpArticleUrls.limitsInfo
                    : uniswapUrls.helpArticleUrls.uniswapXInfo
                }
              >
                {isLimitTrade(initialTrade) ? (
                  <Trans i18nKey="limits.learnMore" />
                ) : (
                  <Trans i18nKey="uniswapX.learnMore" />
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
                <Trans i18nKey="common.viewOnExplorer" />
              </ExternalLink>
            </ThemedText.BodySmall>
          </Row>
        )}
      </HeaderContainer>
    </Container>
  )
}
