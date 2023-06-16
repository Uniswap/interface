import { t, Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ColumnCenter } from 'components/Column'
import Column from 'components/Column'
import Row from 'components/Row'
import { SupportedChainId } from 'constants/chains'
import { useUnmountingAnimation } from 'hooks/useUnmountingAnimation'
import { ReactNode, useRef } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { useIsTransactionConfirmed } from 'state/transactions/hooks'
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
  swapTxHash?: string
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
  tokenApprovalPending: boolean
  revocationPending: boolean
  swapTxHash?: string
  chainId?: number
}

function getContent(args: ContentArgs): PendingModalStep {
  const {
    step,
    approvalCurrency,
    swapConfirmed,
    swapPending,
    tokenApprovalPending,
    revocationPending,
    trade,
    swapTxHash,
    chainId,
  } = args
  switch (step) {
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
    case ConfirmModalState.PENDING_CONFIRMATION:
      return {
        title: swapPending ? t`Transaction submitted` : swapConfirmed ? t`Success` : t`Confirm Swap`,
        subtitle: trade ? <TradeSummary trade={trade} /> : null,
        label:
          swapConfirmed && swapTxHash && chainId ? (
            <ExternalLink
              href={getExplorerLink(chainId, swapTxHash, ExplorerDataType.TRANSACTION)}
              color="textSecondary"
            >
              <Trans>View on Explorer</Trans>
            </ExternalLink>
          ) : !swapPending ? (
            t`Proceed in your wallet`
          ) : null,
      }
  }
}

export function PendingModalContent({
  steps,
  currentStep,
  trade,
  swapTxHash,
  hideStepIndicators,
  tokenApprovalPending = false,
  revocationPending = false,
}: PendingModalContentProps) {
  const { chainId } = useWeb3React()
  const swapConfirmed = useIsTransactionConfirmed(swapTxHash)
  const swapPending = swapTxHash !== undefined && !swapConfirmed
  const { label, button } = getContent({
    step: currentStep,
    approvalCurrency: trade?.inputAmount.currency,
    swapConfirmed,
    swapPending,
    tokenApprovalPending,
    revocationPending,
    swapTxHash,
    trade,
    chainId,
  })
  const currentStepContainerRef = useRef<HTMLDivElement>(null)
  useUnmountingAnimation(currentStepContainerRef, () => AnimationType.EXITING)

  if (steps.length === 0) {
    return null
  }

  // On mainnet, we show the success icon once the tx is sent, since it takes longer to confirm than on L2s.
  const showSuccess = swapConfirmed || (swapPending && chainId === SupportedChainId.MAINNET)

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
          revocationPending) && <LoadingIndicatorOverlay />}
      </LogoContainer>
      <HeaderContainer gap="md" $disabled={revocationPending || tokenApprovalPending || (swapPending && !showSuccess)}>
        <AnimationWrapper>
          {steps.map((step) => {
            const { title, subtitle } = getContent({
              step,
              approvalCurrency: trade?.inputAmount.currency,
              swapConfirmed,
              swapPending,
              tokenApprovalPending,
              revocationPending,
              swapTxHash,
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
