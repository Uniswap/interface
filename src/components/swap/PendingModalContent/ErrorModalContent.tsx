import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import { ColumnCenter } from 'components/Column'
import QuestionHelper from 'components/QuestionHelper'
import Row from 'components/Row'
import { AlertTriangle } from 'react-feather'
import { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

import { PendingModalContainer } from '.'

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
        title: <Trans>Token approval failed</Trans>,
        label: <Trans>Why are approvals required?</Trans>,
        tooltipText: (
          <Trans>
            This provides the Uniswap protocol access to your token for trading. For security, this will expire after 30
            days.
          </Trans>
        ),
      }
    case PendingModalError.PERMIT_ERROR:
      return {
        title: <Trans>Permit approval failed</Trans>,
        label: <Trans>Why are permits required?</Trans>,
        tooltipText: (
          <Trans>Permit2 allows token approvals to be shared and managed across different applications.</Trans>
        ),
      }
    case PendingModalError.CONFIRMATION_ERROR:
      return {
        title: <Trans>Swap failed</Trans>,
      }
  }
}

export function ErrorModalContent({ errorType, onRetry }: ErrorModalContentProps) {
  const theme = useTheme()

  const { title, label, tooltipText } = getErrorContent(errorType)

  return (
    <PendingModalContainer gap="lg">
      <AlertTriangle data-testid="pending-modal-failure-icon" strokeWidth={1} color={theme.accentFailure} size="48px" />
      <ColumnCenter gap="md">
        <ThemedText.HeadlineSmall>{title}</ThemedText.HeadlineSmall>
        <Row justify="center">
          {label && <ThemedText.Caption color="textSecondary">{label}</ThemedText.Caption>}
          {tooltipText && <QuestionHelper text={tooltipText} />}
        </Row>
      </ColumnCenter>
      <Row justify="center">
        <ButtonPrimary marginX="24px" marginBottom="16px" onClick={onRetry}>
          <Trans>Retry</Trans>
        </ButtonPrimary>
      </Row>
    </PendingModalContainer>
  )
}
