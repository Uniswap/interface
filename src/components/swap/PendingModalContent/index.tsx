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

import { ConfirmModalState } from '../ConfirmSwapModal'
import {
  AnimatedEntranceConfirmationIcon,
  CurrencyLoader,
  LoadingIndicatorOverlay,
  LogoContainer,
  PaperIcon,
} from './Logos'
import { TradeSummary } from './TradeSummary'

export const PendingModalContainer = styled(ColumnCenter)`
  margin: 48px 0 28px;
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

enum AnimationType {
  EXITING = 'exiting',
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateX(40px) }
  to { opacity: 1; transform: translateX(0px) }
`
const fadeInAnimation = css`
  animation: ${fadeIn} ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`
const fadeOut = keyframes`
  from { opacity: 1; transform: translateX(0px) }
  to { opacity: 0; transform: translateX(-40px) }
`
const fadeOutAnimation = css`
  animation: ${fadeOut} ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
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
  transition: display ${({ theme }) => theme.transition.duration.medium} ${({ theme }) => theme.transition.timing.inOut};
  ${({ disableEntranceAnimation }) =>
    !disableEntranceAnimation &&
    css`
      ${fadeInAnimation}
    `}

  &.${AnimationType.EXITING} {
    ${fadeOutAnimation}
  }
`

// This component is used for all steps after ConfirmModalState.REVIEWING
export type PendingConfirmModalState = Extract<
  ConfirmModalState,
  ConfirmModalState.APPROVING_TOKEN | ConfirmModalState.PERMITTING | ConfirmModalState.PENDING_CONFIRMATION
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
}

interface ContentArgs {
  step: PendingConfirmModalState
  approvalCurrency?: Currency
  trade?: InterfaceTrade
  swapConfirmed: boolean
  swapPending: boolean
  tokenApprovalPending: boolean
  swapTxHash?: string
}

function getContent(args: ContentArgs): PendingModalStep {
  const { step, approvalCurrency, swapConfirmed, swapPending, tokenApprovalPending, trade } = args
  switch (step) {
    case ConfirmModalState.APPROVING_TOKEN:
      return {
        title: t`Allow trading ${approvalCurrency?.symbol ?? 'token'} on Uniswap`,
        subtitle: (
          <>
            <Trans>First, we need your permission to use your DAI for swapping.</Trans>{' '}
            <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/8120520483085">
              <Trans>Why is this required?</Trans>
            </ExternalLink>
          </>
        ),
        label: tokenApprovalPending ? t`Pending...` : t`Proceed in your wallet`,
      }
    case ConfirmModalState.PERMITTING:
      return {
        title: t`Unlock ${approvalCurrency?.symbol ?? 'token'} for swapping`,
        subtitle: (
          <>
            <Trans>This will expire after 30 days for your security.</Trans>{' '}
            <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/360056642192">
              <Trans>Why is this required?</Trans>
            </ExternalLink>
          </>
        ),
        label: t`Proceed in your wallet`,
      }
    case ConfirmModalState.PENDING_CONFIRMATION:
      return {
        title: swapPending ? t`Transaction submitted` : swapConfirmed ? t`Success` : t`Confirm Swap`,
        subtitle: trade ? <TradeSummary trade={trade} /> : null,
        label: swapConfirmed ? (
          <ExternalLink href={`https://etherscan.io/tx/${swapConfirmed}`} color="textSecondary">
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
    swapTxHash,
    trade,
  })
  const currentStepContainerRef = useRef<HTMLDivElement>(null)
  useUnmountingAnimation(currentStepContainerRef, () => AnimationType.EXITING)

  if (steps.length === 0) {
    return null
  }

  return (
    <PendingModalContainer gap="lg">
      <LogoContainer>
        <PaperIcon visible={currentStep === ConfirmModalState.APPROVING_TOKEN} />
        <CurrencyLoader
          visible={currentStep !== ConfirmModalState.PENDING_CONFIRMATION}
          currency={trade?.inputAmount.currency}
          asBadge={currentStep === ConfirmModalState.APPROVING_TOKEN}
        />
        {currentStep === ConfirmModalState.PENDING_CONFIRMATION &&
        // On mainnet, we show the success icon once the tx is sent, since it takes longer to confirm than on L2s.
        (swapConfirmed || (swapPending && chainId === SupportedChainId.MAINNET)) ? (
          <AnimatedEntranceConfirmationIcon />
        ) : (
          <LoadingIndicatorOverlay />
        )}
      </LogoContainer>
      <HeaderContainer gap="md" $disabled={tokenApprovalPending || swapPending}>
        <AnimationWrapper>
          {steps.map((step) => {
            const { title, subtitle } = getContent({
              step,
              approvalCurrency: trade?.inputAmount.currency,
              swapConfirmed,
              swapPending,
              tokenApprovalPending,
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
                  <ThemedText.SubHeaderLarge textAlign="center">{title}</ThemedText.SubHeaderLarge>
                  {subtitle && <ThemedText.LabelSmall textAlign="center">{subtitle}</ThemedText.LabelSmall>}
                </StepTitleAnimationContainer>
              )
            )
          })}
        </AnimationWrapper>
        <Row justify="center" marginTop="32px">
          {label && <ThemedText.Caption color="textSecondary">{label}</ThemedText.Caption>}
        </Row>
      </HeaderContainer>
      {button && <Row justify="center">{button}</Row>}
      {!hideStepIndicators && (
        <Row gap="14px" justify="center">
          {steps.map((_, i) => {
            return <StepCircle key={i} active={steps.indexOf(currentStep) === i} />
          })}
        </Row>
      )}
    </PendingModalContainer>
  )
}
