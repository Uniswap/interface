import { t, Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { ButtonPrimary } from 'components/Button'
import { ColumnCenter } from 'components/Column'
import Loader from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import QuestionHelper from 'components/QuestionHelper'
import Row from 'components/Row'
import AnimatedConfirmation from 'components/TransactionConfirmationModal/AnimatedConfirmation'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import { useIsTransactionConfirmed } from 'state/transactions/hooks'
import styled, { DefaultTheme, useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme/components/text'

import { ConfirmModalState } from './ConfirmSwapModal'

const Container = styled(ColumnCenter)`
  margin: 48px 0 28px;
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
  approvalCurrency?: Currency
  hideStepIndicators?: boolean
  txHash?: string
}

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

function getContent(
  step: PendingConfirmModalState,
  approvalCurrency: Currency | undefined,
  confirmed: boolean,
  theme: DefaultTheme
): PendingModalStep {
  switch (step) {
    case ConfirmModalState.APPROVING_TOKEN:
      return {
        title: t`Approve permit`,
        subtitle: t`Proceed in wallet`,
        label: t`Why are permits required?`,
        tooltipText: t`Permit2 allows token approvals to be shared and managed across different applications.`,
        logo: <CurrencyLoader currency={approvalCurrency} />,
      }
    case ConfirmModalState.PERMITTING:
      return {
        title: t`Approve ${approvalCurrency?.symbol ?? 'token'}`,
        subtitle: t`Proceed in wallet`,
        label: t`Why are approvals required?`,
        tooltipText: t`This provides the Uniswap protocol access to your token for trading. For security, this will expire after 30 days.`,
        logo: <CurrencyLoader currency={approvalCurrency} />,
      }
    case ConfirmModalState.PENDING_CONFIRMATION:
      return {
        title: t`Confirm Swap`,
        subtitle: t`Proceed in wallet`,
        logo: confirmed ? <SizedAnimatedConfirmation /> : <Loader stroke={theme.textTertiary} size="48px" />,
      }
  }
}

export function PendingModalContent({
  steps,
  currentStep,
  approvalCurrency,
  txHash,
  hideStepIndicators,
}: PendingModalContentProps) {
  const theme = useTheme()
  const confirmed = useIsTransactionConfirmed(txHash)
  const { logo, title, subtitle, label, tooltipText, button } = getContent(
    currentStep,
    approvalCurrency,
    confirmed,
    theme
  )
  if (steps.length === 0) {
    return null
  }
  return (
    <Container gap="lg">
      {logo}
      {/* TODO: implement animations between title/subtitles of each step. */}
      <ColumnCenter gap="md">
        <ThemedText.HeadlineSmall data-testid="PendingModalContent-title">{title}</ThemedText.HeadlineSmall>
        {subtitle && (
          <ThemedText.LabelSmall data-testid="PendingModalContent-subtitle">{subtitle}</ThemedText.LabelSmall>
        )}
        <Row justify="center">
          {label && (
            <ThemedText.Caption color="textSecondary" data-testid="PendingModalContent-label">
              {label}
            </ThemedText.Caption>
          )}
          {tooltipText && <QuestionHelper text={tooltipText} />}
        </Row>
      </ColumnCenter>
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
        title: t`Confirmation failed`,
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
