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
import { ReactNode, useRef } from 'react'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { useOrder } from 'state/signatures/hooks'
import { UniswapXOrderDetails } from 'state/signatures/types'
import { useIsTransactionConfirmed, useSwapTransactionStatus } from 'state/transactions/hooks'
import styled, { css, keyframes } from 'styled-components/macro'
import { ExternalLink } from 'theme'
import { ThemedText } from 'theme/components/text'
import { getExplorerLink } from 'utils/getExplorerLink'
import { ExplorerDataType } from 'utils/getExplorerLink'

import { ConfirmModalState } from '../ConfirmSwapModal'
import {
  AnimatedEntranceConfirmationIcon,
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
  background-color: ${({ theme, active }) => (active ? theme.accentAction : theme.textTertiary)};
  outline: 3px solid ${({ theme, active }) => (active ? theme.accentActionSoft : theme.accentTextLightTertiary)};
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
  | ConfirmModalState.RESETTING_USDT
>

interface PendingModalStep {
  title: ReactNode
  subtitle?: ReactNode
  label?: ReactNode
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
  step: PendingConfirmModalState
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

function getContent(args: ContentArgs): PendingModalStep {
  const {
    step,
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

  switch (step) {
    case ConfirmModalState.WRAPPING:
      return {
        title: t`Wrap ETH`,
        subtitle: (
          <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/16015852009997">
            <Trans>Why is this required?</Trans>
          </ExternalLink>
        ),
        label: wrapPending ? t`Pending...` : t`Proceed in your wallet`,
      }
    case ConfirmModalState.RESETTING_USDT:
      return {
        title: t`Reset USDT`,
        subtitle: t`USDT requires resetting approval when spending limits are too low.`,
        label: revocationPending ? t`Pending...` : t`Proceed in your wallet`,
      }
    case ConfirmModalState.APPROVING_TOKEN:
      return {
        title: t`Enable spending ${approvalCurrency?.symbol ?? 'this token'} on Uniswap`,
        subtitle: (
          <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/8120520483085">
            <Trans>Why is this required?</Trans>
          </ExternalLink>
        ),
        label: tokenApprovalPending ? t`Pending...` : t`Proceed in your wallet`,
      }
    case ConfirmModalState.PERMITTING:
      return {
        title: t`Allow ${approvalCurrency?.symbol ?? 'this token'} to be used for swapping`,
        subtitle: (
          <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/8120520483085">
            <Trans>Why is this required?</Trans>
          </ExternalLink>
        ),
        label: t`Proceed in your wallet`,
      }
    case ConfirmModalState.PENDING_CONFIRMATION: {
      let labelText: string | null = null
      let href: string | null = null

      if (swapPending && trade?.fillType === TradeFillType.UniswapX) {
        labelText = t`Learn more about swapping with UniswapX`
        href = 'https://support.uniswap.org/hc/en-us/articles/17515415311501'
      } else if (chainId && (swapConfirmed || swapPending) && swapResult && swapResult.type === TradeFillType.Classic) {
        labelText = t`View on Explorer`
        href = getExplorerLink(chainId, swapResult.response.hash, ExplorerDataType.TRANSACTION)
      } else {
        labelText = t`Proceed in your wallet`
      }

      return {
        title: swapPending ? t`Swap submitted` : swapConfirmed ? t`Success` : t`Confirm Swap`,
        subtitle: trade ? <TradeSummary trade={trade} /> : null,
        label: href ? (
          <ExternalLink href={href} color="textSecondary">
            {labelText}
          </ExternalLink>
        ) : (
          labelText
        ),
      }
    }
  }
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

  const classicSwapConfirmed = swapStatus === TransactionStatus.Confirmed
  const wrapConfirmed = useIsTransactionConfirmed(wrapTxHash)
  // TODO(UniswapX): Support UniswapX status here too
  const uniswapXSwapConfirmed = Boolean(swapResult)

  const swapConfirmed = swapResult?.type === TradeFillType.Classic ? classicSwapConfirmed : uniswapXSwapConfirmed

  const swapPending = swapResult !== undefined && !swapConfirmed
  const wrapPending = wrapTxHash != undefined && !wrapConfirmed

  const { label, button } = getContent({
    step: currentStep,
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

  const order = useOrder(swapResult?.type === TradeFillType.UniswapX ? swapResult.response.orderHash : '')

  const currentStepContainerRef = useRef<HTMLDivElement>(null)
  useUnmountingAnimation(currentStepContainerRef, () => AnimationType.EXITING)

  if (steps.length === 0) {
    return null
  }

  // Return finalized-order-specifc content if available
  if (order && order.status !== UniswapXOrderStatus.OPEN) {
    return <OrderContent order={{ status: order.status, orderHash: order.orderHash, details: order }} />
  }

  // On mainnet, we show the success icon once the tx is sent, since it takes longer to confirm than on L2s.
  const showSuccess = swapConfirmed || (swapPending && chainId === ChainId.MAINNET)

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
        {/* Scales in for the USDT revoke allowance step if the revoke is pending onchain confirmation. */}
        {/* Scales in for the setup approval step if the approval is pending onchain confirmation. */}
        {/* Scales in for the final step if the swap is pending user signature or onchain confirmation. */}
        {((currentStep === ConfirmModalState.PENDING_CONFIRMATION && !showSuccess) ||
          tokenApprovalPending ||
          wrapPending ||
          revocationPending) && <LoadingIndicatorOverlay />}
      </LogoContainer>
      <HeaderContainer
        gap="md"
        $disabled={revocationPending || tokenApprovalPending || wrapPending || (swapPending && !showSuccess)}
      >
        <AnimationWrapper>
          {steps.map((step) => {
            const { title, subtitle } = getContent({
              step,
              approvalCurrency: trade?.inputAmount.currency,
              swapConfirmed,
              swapPending,
              wrapPending,
              revocationPending,
              tokenApprovalPending,
              swapResult,
              trade,
            })
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
                    {title}
                  </ThemedText.SubHeaderLarge>
                  <ThemedText.LabelSmall textAlign="center">{subtitle}</ThemedText.LabelSmall>
                </StepTitleAnimationContainer>
              )
            )
          })}
        </AnimationWrapper>
        <Row justify="center" marginTop="32px" minHeight="24px">
          <ThemedText.Caption color="textSecondary">{label}</ThemedText.Caption>
        </Row>
      </HeaderContainer>
      {button && <Row justify="center">{button}</Row>}
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
