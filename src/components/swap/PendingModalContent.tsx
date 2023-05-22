import { t, Trans } from '@lingui/macro'
import { formatCurrencyAmount } from '@uniswap/conedison/format'
import { NumberType } from '@uniswap/conedison/format'
import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ButtonPrimary } from 'components/Button'
import { ColumnCenter } from 'components/Column'
import Loader from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import QuestionHelper from 'components/QuestionHelper'
import Row from 'components/Row'
import AnimatedConfirmation from 'components/TransactionConfirmationModal/AnimatedConfirmation'
import { SupportedChainId } from 'constants/chains'
import { ReactNode } from 'react'
import { AlertTriangle, ArrowRight } from 'react-feather'
import { InterfaceTrade } from 'state/routing/types'
import { useIsTransactionConfirmed } from 'state/transactions/hooks'
import styled, { DefaultTheme, useTheme } from 'styled-components/macro'
import { ExternalLink } from 'theme'
import { ThemedText } from 'theme/components/text'

import { ReactComponent as PapersIcon } from '../../assets/svg/papers-text.svg'
import { ConfirmModalState } from './ConfirmSwapModal'

const Container = styled(ColumnCenter)`
  margin: 48px 0 28px;
`

const HeaderContainer = styled(ColumnCenter)<{ $disabled?: boolean }>`
  ${({ $disabled }) => $disabled && `opacity: 0.5;`}
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

const SizedAnimatedConfirmation = styled(AnimatedConfirmation)`
  height: 48px;
  width: 48px;
`

// TODO: switch to LoaderV2 with updated API to support changing color and size.
const LoadingIndicator = styled(Loader)`
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  top: -4px;
  left: -4px;
  position: absolute;
`

function CurrencyLoader({ currency }: { currency?: Currency }) {
  const theme = useTheme()
  return (
    <LogoContainer data-testid={`pending-modal-currency-logo-loader-${currency?.symbol}`}>
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

function PaperIcon({ currency, loading }: { currency?: Currency; loading: boolean }) {
  const theme = useTheme()
  return (
    <LogoContainer data-testid={`papers-icon-container-${currency?.symbol}`}>
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

function TradeSummary({ trade }: { trade: InterfaceTrade }) {
  const theme = useTheme()
  return (
    <Row gap="sm">
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
  trade?: InterfaceTrade
  swapTxHash?: string
  hideStepIndicators?: boolean
  tokenApprovalPending?: boolean
}

interface ContentArgs {
  chainId?: number
  step: PendingConfirmModalState
  approvalCurrency?: Currency
  trade?: InterfaceTrade
  swapConfirmed: boolean
  swapPending: boolean
  tokenApprovalPending: boolean
  theme: DefaultTheme
  swapTxHash?: string
}

function getContent(args: ContentArgs): PendingModalStep {
  const { chainId, step, approvalCurrency, swapConfirmed, swapPending, tokenApprovalPending, theme, trade } = args
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
        logo: <PaperIcon currency={approvalCurrency} loading={tokenApprovalPending} />,
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
          // On mainnet, we show the success icon once the tx is sent, since it takes longer to confirm than on L2s.
          swapConfirmed || (swapPending && chainId === SupportedChainId.MAINNET) ? (
            <SizedAnimatedConfirmation />
          ) : (
            <Loader stroke={theme.textTertiary} size="48px" />
          ),
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
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const swapConfirmed = useIsTransactionConfirmed(swapTxHash)
  const swapPending = swapTxHash !== undefined && !swapConfirmed
  const { logo, title, subtitle, label, button } = getContent({
    chainId,
    step: currentStep,
    approvalCurrency: trade?.inputAmount.currency,
    swapConfirmed,
    swapPending,
    tokenApprovalPending,
    theme,
    swapTxHash,
    trade,
  })

  if (steps.length === 0) {
    return null
  }

  return (
    <Container gap="lg">
      {logo}
      {/* TODO: implement animations between title/subtitles of each step. */}
      <HeaderContainer gap="md" $disabled={tokenApprovalPending || swapPending}>
        <ThemedText.HeadlineSmall data-testid="PendingModalContent-title">{title}</ThemedText.HeadlineSmall>
        {subtitle && (
          <ThemedText.LabelSmall textAlign="center" data-testid="PendingModalContent-subtitle">
            {subtitle}
          </ThemedText.LabelSmall>
        )}
        <Row justify="center" marginTop="32px">
          {label && (
            <ThemedText.Caption color="textSecondary" data-testid="PendingModalContent-label">
              {label}
            </ThemedText.Caption>
          )}
        </Row>
      </HeaderContainer>
      {button && (
        <Row justify="center" data-testid="PendingModalContent-button">
          {button}
        </Row>
      )}
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
      <AlertTriangle strokeWidth={1} color={theme.accentFailure} size="48px" data-testid="pending-modal-failure-icon" />
      <ColumnCenter gap="md">
        <ThemedText.HeadlineSmall>{title}</ThemedText.HeadlineSmall>
        <Row justify="center">
          {label && <ThemedText.Caption color="textSecondary">{label}</ThemedText.Caption>}
          {tooltipText && <QuestionHelper text={tooltipText} />}
        </Row>
      </ColumnCenter>
      <Row justify="center">
        <ButtonPrimary marginX="24px" onClick={onRetry} data-testid="pending-modal-content-retry">
          <Trans>Retry</Trans>
        </ButtonPrimary>
      </Row>
    </Container>
  )
}
