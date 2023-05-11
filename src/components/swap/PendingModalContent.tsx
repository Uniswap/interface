import { ColumnCenter } from 'components/Column'
import Loader from 'components/Icons/LoadingSpinner'
import QuestionHelper from 'components/QuestionHelper'
import Row from 'components/Row'
import AnimatedConfirmation from 'components/TransactionConfirmationModal/AnimatedConfirmation'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme/components/text'

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

// TODO: switch to LoaderV2 with updated API to support changing color and size.
const LoadingIndicator = styled(Loader)`
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  top: -4px;
  left: -4px;
  position: absolute;
`

export interface PendingModalStep {
  title: ReactNode
  subtitle?: ReactNode
  label?: ReactNode
  tooltipText?: ReactNode
  logo?: ReactNode
  button?: ReactNode
}

interface PendingModalContentProps {
  steps: PendingModalStep[]
  activeStepIndex: number
  confirmed: boolean
  transactionSuccess: boolean
  hideStepIndicators?: boolean
}

export function PendingModalContent({
  activeStepIndex,
  steps,
  confirmed,
  transactionSuccess,
  hideStepIndicators,
}: PendingModalContentProps) {
  const theme = useTheme()
  const { logo, title, subtitle, label, tooltipText, button } = steps[activeStepIndex]
  return (
    <Container gap="lg">
      {confirmed ? (
        transactionSuccess ? (
          <AnimatedConfirmation size="48px" />
        ) : (
          <AlertTriangle strokeWidth={1} color={theme.accentFailure} size="48px" />
        )
      ) : logo ? (
        <LogoContainer>
          <LogoLayer>{logo}</LogoLayer>
          <LoadingIndicator stroke={theme.textTertiary} />
        </LogoContainer>
      ) : (
        <Loader stroke={theme.textTertiary} size="48px" />
      )}
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
            return <StepCircle key={i} active={activeStepIndex === i} />
          })}
        </Row>
      )}
    </Container>
  )
}
