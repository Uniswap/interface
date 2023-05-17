import { t, Trans } from '@lingui/macro'
import { formatCurrencyAmount } from '@uniswap/conedison/format'
import { NumberType } from '@uniswap/conedison/format'
import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ButtonPrimary } from 'components/Button'
import { ColumnCenter } from 'components/Column'
import Column from 'components/Column'
import Loader from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import QuestionHelper from 'components/QuestionHelper'
import Row from 'components/Row'
import Tooltip from 'components/Tooltip'
import AnimatedConfirmation from 'components/TransactionConfirmationModal/AnimatedConfirmation'
import { SupportedChainId } from 'constants/chains'
import { ReactNode, RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight } from 'react-feather'
import { InterfaceTrade } from 'state/routing/types'
import { useIsTransactionConfirmed } from 'state/transactions/hooks'
import styled, { css, DefaultTheme, keyframes, useTheme } from 'styled-components/macro'
import { ExternalLink } from 'theme'
import { ThemedText } from 'theme/components/text'

import { ReactComponent as PapersIcon } from '../../assets/svg/papers-text.svg'
import { ConfirmModalState } from './ConfirmSwapModal'

const Container = styled(ColumnCenter)`
  margin: 48px 0 28px;
`

const HeaderContainer = styled(ColumnCenter)<{ $disabled?: boolean }>`
  ${({ $disabled }) => $disabled && `opacity: 0.5;`}
  padding: 0 32px;
`

const LogoContainer = styled.div`
  position: relative;
  display: flex;
  border-radius: 50%;
  overflow: visible;
`

const LogoLayer = styled.div`
  z-index: 2;
`

const StepCircle = styled.div<{ active: boolean }>`
  height: 10px;
  width: 10px;
  border-radius: 50%;
  background-color: ${({ theme, active }) => (active ? theme.accentAction : theme.textTertiary)};
  outline: 3px solid ${({ theme, active }) => (active ? theme.accentActionSoft : theme.accentTextLightTertiary)};
`

const TooltipLink = styled(ThemedText.Link)`
  cursor: help;
`

// TODO: switch to LoaderV2 with updated API to support changing color and size.
const LoadingIndicator = styled(Loader)`
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  top: -4px;
  left: -4px;
  position: absolute;
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

const StepTitleAnimationContainer = styled(Column)`
  position: absolute;
  width: 100%;
  align-items: center;
  transition: display ${({ theme }) => theme.transition.duration.medium} ${({ theme }) => theme.transition.timing.inOut};
  ${fadeInAnimation}
  &.${AnimationType.EXITING} {
    ${fadeOutAnimation}
  }
`

function CurrencyLoader({ currency }: { currency: Currency | undefined }) {
  const theme = useTheme()
  return (
    <LogoContainer>
      <LogoLayer>
        <CurrencyLogo currency={currency} size="48px" />
      </LogoLayer>
      <LoadingIndicator stroke={theme.textTertiary} />
    </LogoContainer>
  )
}

const PinkCircle = styled(LogoContainer)`
  display: flex;
  height: 48px;
  width: 48px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.userThemeColor};
  z-index: 1;
`

function PaperIcon({ currency, loading }: { currency: Currency | undefined; loading: boolean }) {
  const theme = useTheme()
  return (
    <LogoContainer>
      <PinkCircle>
        <PapersIcon />
        <CurrencyLogo
          currency={currency}
          size="20px"
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            outline: `2px solid ${theme.background}`,
            borderRadius: '50%',
          }}
        />
      </PinkCircle>
      {loading && <LoadingIndicator stroke={theme.textTertiary} />}
    </LogoContainer>
  )
}

function SubtitleWithTooltip({ mainText, tooltipText }: { mainText: string; tooltipText: string }) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  return (
    <>
      {mainText}{' '}
      <Tooltip text={tooltipText} show={show}>
        <TooltipLink onClick={open} onMouseEnter={open} onMouseLeave={close}>
          <Trans>Why is this required?</Trans>
        </TooltipLink>
      </Tooltip>
    </>
  )
}

function TradeSummary({ trade }: { trade: InterfaceTrade }) {
  const theme = useTheme()
  return (
    <Row gap="sm" justify="center" align="center">
      <CurrencyLogo currency={trade.inputAmount.currency} size="16px" />
      <ThemedText.LabelSmall color="textPrimary">
        {formatCurrencyAmount(trade.inputAmount, NumberType.SwapTradeAmount)}
      </ThemedText.LabelSmall>
      <ThemedText.LabelSmall color="textPrimary">{trade.inputAmount.currency.symbol}</ThemedText.LabelSmall>
      <ArrowRight color={theme.textPrimary} size="12px" />
      <CurrencyLogo currency={trade.outputAmount.currency} size="16px" />
      <ThemedText.LabelSmall color="textPrimary">
        {formatCurrencyAmount(trade.outputAmount, NumberType.SwapTradeAmount)}
      </ThemedText.LabelSmall>
      <ThemedText.LabelSmall color="textPrimary">{trade.outputAmount.currency.symbol}</ThemedText.LabelSmall>
    </Row>
  )
}

// This component is used for all steps after ConfirmModalState.REVIEWING
export type PendingConfirmModalState = Extract<
  ConfirmModalState,
  ConfirmModalState.APPROVING_TOKEN | ConfirmModalState.PERMITTING | ConfirmModalState.PENDING_CONFIRMATION
>

interface PendingModalStep {
  title: ReactNode
  subtitle?: ReactNode
  label?: ReactNode
  tooltipText?: ReactNode
  logo?: ReactNode
  button?: ReactNode
}

interface PendingModalContentProps {
  steps: PendingConfirmModalState[]
  currentStep: PendingConfirmModalState
  trade: InterfaceTrade | undefined
  swapHash: string | undefined
  hideStepIndicators?: boolean
  tokenApprovalPending?: boolean
}

interface ContentArgs {
  chainId: number | undefined
  step: PendingConfirmModalState
  approvalCurrency: Currency | undefined
  trade: InterfaceTrade | undefined
  swapConfirmed: boolean
  swapPending: boolean
  tokenApprovalPending: boolean
  theme: DefaultTheme
  swapHash: string | undefined
}

function getContent(args: ContentArgs): PendingModalStep {
  const { chainId, step, approvalCurrency, swapConfirmed, swapPending, tokenApprovalPending, theme, trade } = args
  switch (step) {
    case ConfirmModalState.APPROVING_TOKEN:
      return {
        title: t`Allow trading ${approvalCurrency?.symbol} on Uniswap`,
        subtitle: (
          <SubtitleWithTooltip
            mainText={t`First, we need your permission to use your DAI for swapping.`}
            tooltipText={t`Permit2 allows token approvals to be shared and managed across different applications.`}
          />
        ),
        label: tokenApprovalPending ? t`Pending...` : t`Proceed in your wallet`,
        logo: <PaperIcon currency={approvalCurrency} loading={tokenApprovalPending} />,
      }
    case ConfirmModalState.PERMITTING:
      return {
        title: t`Unlock ${approvalCurrency?.symbol} for swapping`,
        subtitle: (
          <SubtitleWithTooltip
            mainText={t`This will expire after 30 days for your security.`}
            tooltipText={t`This provides the Uniswap protocol access to your token for trading. For security, this will expire after 30 days.`}
          />
        ),
        label: t`Proceed in your wallet`,
        logo: <CurrencyLoader currency={approvalCurrency} />,
      }
    case ConfirmModalState.PENDING_CONFIRMATION:
      return {
        title: swapPending ? t`Transaction submitted` : swapConfirmed ? t`Success` : t`Confirm Swap`,
        subtitle: swapConfirmed ? (
          <ExternalLink href={`https://etherscan.io/tx/${swapConfirmed}`} color="textSecondary">
            <Trans>View on Explorer</Trans>
          </ExternalLink>
        ) : trade ? (
          <TradeSummary trade={trade} />
        ) : null,
        label: !swapPending && !swapConfirmed ? t`Proceed in your wallet` : null,
        logo:
          swapConfirmed || (swapPending && chainId === SupportedChainId.MAINNET) ? (
            <AnimatedConfirmation size="48px" />
          ) : (
            <Loader stroke={theme.textTertiary} size="48px" />
          ),
      }
  }
}

function isAnimating(node?: Animatable | Document) {
  return (node?.getAnimations?.().length ?? 0) > 0
}
function useUnmountingAnimation(
  node: RefObject<HTMLElement>,
  getAnimatingClass: () => string,
  animatedElements?: RefObject<HTMLElement>[],
  skip = false
) {
  useEffect(() => {
    const current = node.current
    const animated = animatedElements?.map((element) => element.current) ?? [current]
    const parent = current?.parentElement
    const removeChild = parent?.removeChild
    if (!(parent && removeChild) || skip) return

    parent.removeChild = function <T extends Node>(child: T) {
      if ((child as Node) === current && animated) {
        animated.forEach((element) => element?.classList.add(getAnimatingClass()))
        const animating = animated.find((element) => isAnimating(element ?? undefined))
        if (animating) {
          animating?.addEventListener('animationend', (x) => {
            // This check is needed because the animationend event will fire for all animations on the
            // element or its children.
            if (x.target === animating) {
              removeChild.call(parent, child)
            }
          })
        } else {
          removeChild.call(parent, child)
        }
        return child
      } else {
        return removeChild.call(parent, child) as T
      }
    }
    return () => {
      parent.removeChild = removeChild
    }
  }, [animatedElements, getAnimatingClass, node, skip])
}

export function PendingModalContent({
  steps,
  currentStep,
  trade,
  swapHash,
  hideStepIndicators,
  tokenApprovalPending = false,
}: PendingModalContentProps) {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const swapConfirmed = useIsTransactionConfirmed(swapHash)
  const swapPending = swapHash !== undefined && !swapConfirmed
  const { logo, label, button } = getContent({
    chainId,
    step: currentStep,
    approvalCurrency: trade?.inputAmount.currency,
    swapConfirmed,
    swapPending,
    tokenApprovalPending,
    theme,
    swapHash,
    trade,
  })
  const currentStepContainerRef = useRef<HTMLDivElement>(null)
  useUnmountingAnimation(currentStepContainerRef, () => AnimationType.EXITING)
  return (
    <Container gap="lg">
      {logo}
      <HeaderContainer gap="md" $disabled={tokenApprovalPending || swapPending}>
        <AnimationWrapper>
          {steps.map((step) => {
            const { title, subtitle } = getContent({
              chainId,
              step,
              approvalCurrency: trade?.inputAmount.currency,
              swapConfirmed,
              swapPending,
              tokenApprovalPending,
              theme,
              swapHash,
              trade,
            })
            // We only render one step at a time, but looping through the array allows us to keep
            // the exiting step in the DOM during its animation.
            return (
              Boolean(step === currentStep) && (
                <StepTitleAnimationContainer
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
    </Container>
  )
}

export enum PendingModalError {
  TOKEN_APPROVAL_ERROR,
  PERMIT_ERROR,
  CONFIRMATION_ERROR,
}

interface ErrorModalContentProps {
  errorType: PendingModalError
  onRetry: () => void
}

function getErrorContent(errorType: PendingModalError) {
  switch (errorType) {
    case PendingModalError.TOKEN_APPROVAL_ERROR:
      return {
        title: t`Token approval failed`,
        label: t`Why are approvals required?`,
        tooltipText: t`This provides the Uniswap protocol access to your token for trading. For security, this will expire after 30 days.`,
      }
    case PendingModalError.PERMIT_ERROR:
      return {
        title: t`Permit approval failed`,
        label: t`Why are permits required?`,
        tooltipText: t`Permit2 allows token approvals to be shared and managed across different applications.`,
      }
    case PendingModalError.CONFIRMATION_ERROR:
      return {
        title: t`Swap failed`,
      }
  }
}

export function ErrorModalContent({ errorType, onRetry }: ErrorModalContentProps) {
  const theme = useTheme()

  const { title, label, tooltipText } = getErrorContent(errorType)

  return (
    <Container gap="lg">
      <AlertTriangle strokeWidth={1} color={theme.accentFailure} size="48px" />
      <ColumnCenter gap="md">
        <ThemedText.HeadlineSmall>{title}</ThemedText.HeadlineSmall>
        <Row justify="center">
          {label && <ThemedText.Caption color="textSecondary">{label}</ThemedText.Caption>}
          {tooltipText && <QuestionHelper text={tooltipText} />}
        </Row>
      </ColumnCenter>
      <Row justify="center">
        <ButtonPrimary marginX="24px" onClick={onRetry}>
          <Trans>Retry</Trans>
        </ButtonPrimary>
      </Row>
    </Container>
  )
}
