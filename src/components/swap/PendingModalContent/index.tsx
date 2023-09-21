import { t, Trans } from '@lingui/macro'
import { ChainId, Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { OrderContent } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import { ColumnCenter } from 'components/Column'
import Column from 'components/Column'
import Row from 'components/Row'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { SwapResult } from 'hooks/useSwapCallback'
import { useUnmountingAnimation } from 'hooks/useUnmountingAnimation'
import { UniswapXOrderStatus } from 'lib/hooks/orders/types'
import { ReactNode, useMemo, useRef } from 'react'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { useOrder } from 'state/signatures/hooks'
import { UniswapXOrderDetails } from 'state/signatures/types'
import { useIsTransactionConfirmed, useSwapTransactionStatus } from 'state/transactions/hooks'
import styled, { css, keyframes } from 'styled-components'
import { ExternalLink } from 'theme'
import { ThemedText } from 'theme/components/text'
import { getExplorerLink } from 'utils/getExplorerLink'
import { ExplorerDataType } from 'utils/getExplorerLink'

import { ConfirmModalState } from '../ConfirmSwapModal'
import {
  AnimatedEntranceConfirmationIcon,
  AnimatedEntranceSubmittedIcon,
  AnimationType,
  CurrencyLoader,
  LoadingIndicatorOverlay,
  LogoContainer,
  PaperIcon,
} from './Logos'
import { TradeSummary } from './TradeSummary'

export const PendingModalContainer = styled(ColumnCenter)`
  margin: 48px 0 8px;
`

const HeaderContainer = styled(ColumnCenter)<{ $disabled?: boolean }>`
  ${({ $disabled }) => $disabled && `opacity: 0.5;`}
  padding: 0 32px;
  overflow: visible;
`

const StepCircle = styled.div<{ active: boolean }>`
  height: 10px;
  width: 10px;
  border-radius: 50%;
  background-color: ${({ theme, active }) => (active ? theme.accent1 : theme.neutral3)};
  outline: 3px solid ${({ theme, active }) => (active ? theme.accent2 : theme.deprecated_accentTextLightPrimary)};
  transition: background-color ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(40px) }
  to { opacity: 1; transform: translateX(0px) }
`
const slideInAnimation = css`
  animation: ${slideIn} ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`
const slideOut = keyframes`
  from { opacity: 1; transform: translateX(0px) }
  to { opacity: 0; transform: translateX(-40px) }
`
const slideOutAnimation = css`
  animation: ${slideOut} ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
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
  align-items: center;
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

// This component is used for all steps after ConfirmModalState.REVIEWING
export type PendingConfirmModalState = Extract<
  ConfirmModalState,
  | ConfirmModalState.APPROVING_TOKEN
  | ConfirmModalState.PERMITTING
  | ConfirmModalState.PENDING_CONFIRMATION
  | ConfirmModalState.WRAPPING
  | ConfirmModalState.RESETTING_TOKEN_ALLOWANCE
>

interface PendingModalStep {
  title: ReactNode
  subtitle?: ReactNode
  bottomLabel?: ReactNode
  logo?: ReactNode
  button?: ReactNode
}

interface PendingModalContentProps {
  steps: PendingConfirmModalState[]
  currentStep: PendingConfirmModalState
  trade?: InterfaceTrade
  swapResult?: SwapResult
  wrapTxHash?: string
  hideStepIndicators?: boolean
  tokenApprovalPending?: boolean
  revocationPending?: boolean
}

interface ContentArgs {
  approvalCurrency?: Currency
  trade?: InterfaceTrade
  swapConfirmed: boolean
  swapPending: boolean
  wrapPending: boolean
  tokenApprovalPending: boolean
  revocationPending: boolean
  swapResult?: SwapResult
  chainId?: number
  order?: UniswapXOrderDetails
}

function getPendingConfirmationContent({
  swapConfirmed,
  swapPending,
  trade,
  chainId,
  swapResult,
}: Pick<ContentArgs, 'swapConfirmed' | 'swapPending' | 'trade' | 'chainId' | 'swapResult'>): PendingModalStep {
  const title = swapPending ? t`Swap submitted` : swapConfirmed ? t`Swap success!` : t`Confirm Swap`
  const tradeSummary = trade ? <TradeSummary trade={trade} /> : null
  if (swapPending && trade?.fillType === TradeFillType.UniswapX) {
    return {
      title,
      subtitle: tradeSummary,
      bottomLabel: (
        <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/17515415311501" color="neutral2">
          <Trans>Learn more about swapping with UniswapX</Trans>
        </ExternalLink>
      ),
    }
  } else if ((swapPending || swapConfirmed) && chainId && swapResult?.type === TradeFillType.Classic) {
    const explorerLink = (
      <ExternalLink
        href={getExplorerLink(chainId, swapResult.response.hash, ExplorerDataType.TRANSACTION)}
        color="neutral2"
      >
        <Trans>View on Explorer</Trans>
      </ExternalLink>
    )
    if (swapPending) {
      // On Mainnet, we show a "submitted" state while the transaction is pending confirmation.
      return {
        title,
        subtitle: chainId === ChainId.MAINNET ? explorerLink : tradeSummary,
        bottomLabel: chainId === ChainId.MAINNET ? t`Transaction pending...` : explorerLink,
      }
    } else {
      return {
        title,
        subtitle: explorerLink,
        bottomLabel: null,
      }
    }
  } else {
    return {
      title,
      subtitle: tradeSummary,
      bottomLabel: t`Proceed in your wallet`,
    }
  }
}

function useStepContents(args: ContentArgs): Record<PendingConfirmModalState, PendingModalStep> {
  const {
    wrapPending,
    approvalCurrency,
    swapConfirmed,
    swapPending,
    tokenApprovalPending,
    revocationPending,
    trade,
    swapResult,
    chainId,
  } = args

  return useMemo(
    () => ({
      [ConfirmModalState.WRAPPING]: {
        title: t`Wrap ETH`,
        subtitle: (
          <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/16015852009997">
            <Trans>Why is this required?</Trans>
          </ExternalLink>
        ),
        bottomLabel: wrapPending ? t`Pending...` : t`Proceed in your wallet`,
      },
      [ConfirmModalState.RESETTING_TOKEN_ALLOWANCE]: {
        title: t`Reset ${approvalCurrency?.symbol}`,
        subtitle: t`${approvalCurrency?.symbol} requires resetting approval when spending limits are too low.`,
        bottomLabel: revocationPending ? t`Pending...` : t`Proceed in your wallet`,
      },
      [ConfirmModalState.APPROVING_TOKEN]: {
        title: t`Enable spending ${approvalCurrency?.symbol ?? 'this token'} on Uniswap`,
        subtitle: (
          <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/8120520483085">
            <Trans>Why is this required?</Trans>
          </ExternalLink>
        ),
        bottomLabel: tokenApprovalPending ? t`Pending...` : t`Proceed in your wallet`,
      },
      [ConfirmModalState.PERMITTING]: {
        title: t`Allow ${approvalCurrency?.symbol ?? 'this token'} to be used for swapping`,
        subtitle: (
          <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/8120520483085">
            <Trans>Why is this required?</Trans>
          </ExternalLink>
        ),
        bottomLabel: t`Proceed in your wallet`,
      },
      [ConfirmModalState.PENDING_CONFIRMATION]: getPendingConfirmationContent({
        chainId,
        swapConfirmed,
        swapPending,
        swapResult,
        trade,
      }),
    }),
    [
      approvalCurrency?.symbol,
      chainId,
      revocationPending,
      swapConfirmed,
      swapPending,
      swapResult,
      tokenApprovalPending,
      trade,
      wrapPending,
    ]
  )
}

export function PendingModalContent({
  steps,
  currentStep,
  trade,
  swapResult,
  wrapTxHash,
  hideStepIndicators,
  tokenApprovalPending = false,
  revocationPending = false,
}: PendingModalContentProps) {
  const { chainId } = useWeb3React()

  const swapStatus = useSwapTransactionStatus(swapResult)
  const order = useOrder(swapResult?.type === TradeFillType.UniswapX ? swapResult.response.orderHash : '')

  const swapConfirmed = swapStatus === TransactionStatus.Confirmed || order?.status === UniswapXOrderStatus.FILLED
  const wrapConfirmed = useIsTransactionConfirmed(wrapTxHash)

  const swapPending = swapResult !== undefined && !swapConfirmed
  const wrapPending = wrapTxHash != undefined && !wrapConfirmed

  const stepContents = useStepContents({
    approvalCurrency: trade?.inputAmount.currency,
    swapConfirmed,
    swapPending,
    wrapPending,
    tokenApprovalPending,
    revocationPending,
    swapResult,
    trade,
    chainId,
  })

  const currentStepContainerRef = useRef<HTMLDivElement>(null)
  useUnmountingAnimation(currentStepContainerRef, () => AnimationType.EXITING)

  if (steps.length === 0) {
    return null
  }

  // Return finalized-order-specifc content if available
  if (order && order.status !== UniswapXOrderStatus.OPEN) {
    return <OrderContent order={{ status: order.status, orderHash: order.orderHash, details: order }} />
  }

  // On mainnet, we show a different icon when the transaction is submitted but pending confirmation.
  const showSubmitted = swapPending && !swapConfirmed && chainId === ChainId.MAINNET
  const showSuccess = swapConfirmed || (chainId !== ChainId.MAINNET && swapPending)

  const transactionPending = revocationPending || tokenApprovalPending || wrapPending || swapPending

  return (
    <PendingModalContainer gap="lg">
      <LogoContainer>
        {/* Shown during the setup approval step, and fades out afterwards. */}
        {currentStep === ConfirmModalState.APPROVING_TOKEN && <PaperIcon />}
        {/* Shown during the setup approval step as a small badge. */}
        {/* Scales up once we transition from setup approval to permit signature. */}
        {/* Fades out after the permit signature. */}
        {currentStep !== ConfirmModalState.PENDING_CONFIRMATION && (
          <CurrencyLoader
            currency={trade?.inputAmount.currency}
            asBadge={currentStep === ConfirmModalState.APPROVING_TOKEN}
          />
        )}
        {/* Shown only during the final step under "success" conditions, and scales in. */}
        {currentStep === ConfirmModalState.PENDING_CONFIRMATION && showSuccess && <AnimatedEntranceConfirmationIcon />}
        {/* Shown only during the final step on mainnet, when the transaction is sent but pending confirmation. */}
        {currentStep === ConfirmModalState.PENDING_CONFIRMATION && showSubmitted && <AnimatedEntranceSubmittedIcon />}
        {/* Scales in for any step that waits for an onchain transaction, while the transaction is pending. */}
        {/* On the last step, appears while waiting for the transaction to be signed too. */}
        {((currentStep !== ConfirmModalState.PENDING_CONFIRMATION && transactionPending) ||
          (currentStep === ConfirmModalState.PENDING_CONFIRMATION && !showSuccess && !showSubmitted)) && (
          <LoadingIndicatorOverlay />
        )}
      </LogoContainer>
      <HeaderContainer gap="md" $disabled={transactionPending}>
        <AnimationWrapper>
          {steps.map((step) => {
            // We only render one step at a time, but looping through the array allows us to keep
            // the exiting step in the DOM during its animation.
            return (
              Boolean(step === currentStep) && (
                <StepTitleAnimationContainer
                  disableEntranceAnimation={steps[0] === currentStep}
                  gap="md"
                  key={step}
                  ref={step === currentStep ? currentStepContainerRef : undefined}
                >
                  <ThemedText.SubHeaderLarge textAlign="center" data-testid="pending-modal-content-title">
                    {stepContents[step].title}
                  </ThemedText.SubHeaderLarge>
                  <ThemedText.LabelSmall textAlign="center">{stepContents[step].subtitle}</ThemedText.LabelSmall>
                </StepTitleAnimationContainer>
              )
            )
          })}
        </AnimationWrapper>
        <Row justify="center" marginTop="32px" minHeight="24px">
          <ThemedText.BodySmall color="neutral2">{stepContents[currentStep].bottomLabel}</ThemedText.BodySmall>
        </Row>
      </HeaderContainer>
      {stepContents[currentStep].button && <Row justify="center">{stepContents[currentStep].button}</Row>}
      {!hideStepIndicators && !showSuccess && (
        <Row gap="14px" justify="center">
          {steps.map((_, i) => {
            return <StepCircle key={i} active={steps.indexOf(currentStep) === i} />
          })}
        </Row>
      )}
    </PendingModalContainer>
  )
}
