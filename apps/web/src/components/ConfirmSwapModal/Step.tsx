import Column from 'components/Column'
import { CheckMark } from 'components/Icons/CheckMark'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import Row, { RowBetween } from 'components/Row'
import { ReactElement, useEffect, useState } from 'react'
import styled, { Keyframes, keyframes } from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'

export interface StepDetails {
  // Left-justified icon representing the step and grayed out when step is not active
  icon: ReactElement
  // Ripple animation around the icon of the currently active step (use color extraction to select)
  rippleColor?: string
  // Text shown before the step becomes active
  previewTitle: string
  // Text shown when the step is active and awaiting user input
  actionRequiredTitle: string | ReactElement
  // Text shown when user input has been accepted and step has yet to complete
  inProgressTitle?: string
  // Amount of time in seconds the user has to take action on a step (e.g. UniswapX exclusivity window)
  timeToStart?: number
  // Text shown when timeToStart is exceeded (countdown reaches zero)
  delayedStartTitle?: string
  // Estimated amount of time in seconds for a pending step to complete (i.e. transaction confirmation time)
  timeToEnd?: number | null
  // Text shown when timeToEnd is exceeded (countdown reaches zero)
  delayedEndTitle?: string
  // Anchor text displayed for the Learn-More link
  learnMoreLinkText?: string
  // URL for Learn-More link (opened in new tab)
  learnMoreLinkHref?: string
}

export enum StepStatus {
  PREVIEW,
  ACTIVE,
  IN_PROGRESS,
  COMPLETE,
}

const ringAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
`
const Ring = styled.div<{ $borderColor: string; $animation: Keyframes }>`
  position: absolute;
  width: 24px;
  height: 24px;
  border: 1px solid ${({ $borderColor }) => $borderColor};
  border-radius: 50%;
  animation: ${({ $animation }) => $animation} 1.5s linear infinite;
`
const IconWrapper = styled.div<{ isActive: boolean }>`
  width: 24px;
  height: 24px;
  filter: ${({ isActive }) => `grayscale(${isActive ? 0 : 1})`};
  opacity: ${({ isActive }) => (isActive ? '1' : '0.5')};
`
function RippleAnimation({ rippleColor }: { rippleColor?: string }) {
  if (!rippleColor) {
    return null
  }
  return (
    <div data-testid="icon-ripple-animation">
      <Ring $borderColor={rippleColor} $animation={ringAnimation} />
    </div>
  )
}

function Icon({ stepStatus, icon, rippleColor }: { stepStatus: StepStatus; icon: ReactElement; rippleColor?: string }) {
  if (stepStatus === StepStatus.IN_PROGRESS) {
    return <LoaderV3 size="24px" stroke={rippleColor} fill={rippleColor} data-testid="loader-icon" />
  }
  return (
    <div>
      {stepStatus === StepStatus.ACTIVE && <RippleAnimation rippleColor={rippleColor} />}
      <IconWrapper isActive={stepStatus === StepStatus.ACTIVE} data-testid="step-icon">
        {icon}
      </IconWrapper>
    </div>
  )
}

function Title({
  stepStatus,
  stepDetails,
  isTimeRemaining,
}: {
  stepStatus: StepStatus
  stepDetails: StepDetails
  isTimeRemaining: boolean
}) {
  switch (stepStatus) {
    case StepStatus.PREVIEW:
      return <ThemedText.LabelSmall>{stepDetails.previewTitle}</ThemedText.LabelSmall>
    case StepStatus.ACTIVE:
      return (
        <ThemedText.BodySmall>
          {isTimeRemaining ? stepDetails.actionRequiredTitle : stepDetails.delayedStartTitle}
        </ThemedText.BodySmall>
      )
    case StepStatus.IN_PROGRESS:
      return (
        <ThemedText.BodySmall>
          {isTimeRemaining ? stepDetails.inProgressTitle : stepDetails.delayedEndTitle}
        </ThemedText.BodySmall>
      )
    case StepStatus.COMPLETE:
      return <ThemedText.LabelSmall>{stepDetails.previewTitle}</ThemedText.LabelSmall>
    default:
      return null
  }
}

const MonospacedTimer = styled(ThemedText.LabelSmall)`
  font-variant-numeric: tabular-nums;
  padding-right: 8px;
`
function Timer({ secondsRemaining }: { secondsRemaining: number }) {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const minutesText = minutes < 10 ? `0${minutes}` : minutes
  const secondsText = seconds < 10 ? `0${seconds}` : seconds
  const timerText = `${minutesText}:${secondsText}`
  return <MonospacedTimer data-testid="step-timer">{timerText}</MonospacedTimer>
}

const Container = styled(RowBetween)`
  padding-right: 16px;
`
const StyledExternalLink = styled(ExternalLink)`
  font-size: 12px;
  font-weight: 485px;
  line-height: 16px;
`
export function Step({ stepStatus, stepDetails }: { stepStatus: StepStatus; stepDetails: StepDetails }) {
  // Timer is shown in two cases:
  // (1) User has a specified amount of time to perform a required action. Timer starts running as soon as the step becomes active.
  // (2) Step has an estimated amount of time in which it should be completed. Timer starts running when step is in progress.
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  useEffect(() => {
    if (stepStatus === StepStatus.ACTIVE && stepDetails?.timeToStart) {
      setSecondsRemaining(stepDetails.timeToStart)
    } else if (stepStatus === StepStatus.IN_PROGRESS && stepDetails?.timeToEnd) {
      setSecondsRemaining(stepDetails.timeToEnd)
    } else {
      setSecondsRemaining(null)
      return
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prevSecondsRemaining) => {
        if (prevSecondsRemaining && prevSecondsRemaining > 0) {
          return prevSecondsRemaining - 1
        }
        clearInterval(timer)
        return 0
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [stepStatus, stepDetails.timeToStart, stepDetails.timeToEnd])

  return (
    <Container>
      <Row align="center" gap="12px" height={40} padding="8px 16px">
        <Icon stepStatus={stepStatus} icon={stepDetails.icon} rippleColor={stepDetails.rippleColor} />
        <Column>
          <Title
            stepStatus={stepStatus}
            stepDetails={stepDetails}
            isTimeRemaining={secondsRemaining === null || secondsRemaining > 0}
          />
          {stepStatus === StepStatus.ACTIVE && stepDetails.learnMoreLinkHref && (
            <StyledExternalLink href={stepDetails.learnMoreLinkHref || ''}>
              {stepDetails.learnMoreLinkText}
            </StyledExternalLink>
          )}
        </Column>
      </Row>
      {secondsRemaining !== null && <Timer secondsRemaining={secondsRemaining} />}
      {stepStatus === StepStatus.COMPLETE && <CheckMark />}
    </Container>
  )
}
