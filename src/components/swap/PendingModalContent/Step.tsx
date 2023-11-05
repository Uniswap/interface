import { CheckMark } from 'components/Icons/CheckMark'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import Row, { RowBetween } from 'components/Row'
import { ReactElement, useEffect, useState } from 'react'
import styled, { Keyframes, keyframes } from 'styled-components'
import { ThemedText } from 'theme/components'

export interface StepDetails {
  icon: ReactElement
  rippleColor?: string
  previewTitle: string
  actionRequiredTitle: string | ReactElement
  inProgressTitle?: string
  delayedStartTitle?: string
  delayedEndTitle?: string
  timeToStart?: number
  timeToEnd?: number | null
  learnMoreLinkText?: string
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
const Ring = styled.div<{ $borderWidth: string; $borderColor: string; $animation: Keyframes }>`
  position: absolute;
  width: 24px;
  height: 24px;
  border: ${({ $borderWidth }) => $borderWidth} solid ${({ $borderColor }) => $borderColor};
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
      <Ring $borderWidth="0.5px" $borderColor={rippleColor} $animation={ringAnimation} />
    </div>
  )
}

function Icon({ stepStatus, icon, rippleColor }: { stepStatus: StepStatus; icon: ReactElement; rippleColor?: string }) {
  if (stepStatus === StepStatus.IN_PROGRESS) {
    return <LoaderV3 size="24px" fill={rippleColor} data-testid="loader-icon" />
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

function Timer({ secondsRemaining }: { secondsRemaining: number }) {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const minutesText = minutes < 10 ? `0${minutes}` : minutes
  const secondsText = seconds < 10 ? `0${seconds}` : seconds
  const timerText = `${minutesText}:${secondsText}`
  return (
    <ThemedText.LabelSmall paddingRight="8px" data-testid="step-timer">
      {timerText}
    </ThemedText.LabelSmall>
  )
}

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
    <RowBetween>
      <Row align="center" gap="12px">
        <Icon stepStatus={stepStatus} icon={stepDetails.icon} rippleColor={stepDetails.rippleColor} />
        <Title
          stepStatus={stepStatus}
          stepDetails={stepDetails}
          isTimeRemaining={secondsRemaining === null || secondsRemaining > 0}
        />
      </Row>
      {secondsRemaining !== null && <Timer secondsRemaining={secondsRemaining} />}
      {stepStatus === StepStatus.COMPLETE && <CheckMark />}
    </RowBetween>
  )
}
