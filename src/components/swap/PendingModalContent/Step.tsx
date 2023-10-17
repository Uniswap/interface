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
  delayedTitle?: string
  delayedStartTitle?: string
  delayedEndTitle?: string
  timerValueInSeconds?: number
  timeToStart?: number
  timeToEnd?: number
  learnMoreLinkText?: string
  learnMoreLinkHref?: string
}

export enum StepStatus {
  PREVIEW,
  ACTIVE,
  IN_PROGRESS,
  COMPLETE,
}

const outerRingAnimation = keyframes`
  0% {
    transform: scale(1.4);
    opacity: 0.25;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.75;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
`
const innerRingAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.25;
  }
  30% {
    transform: scale(1.3);
    opacity: 1;
  }
  60% {
    transform: scale(1.3);
    opacity: 0.4;
  }
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`
const Ring = styled.div<{ width: string; color: string; animation: Keyframes }>`
  position: absolute;
  width: 24px;
  height: 24px;
  border: ${({ width }) => width} solid ${({ color }) => color};
  border-radius: 50%;
  animation: ${({ animation }) => animation} 2s linear infinite;
`
const IconWrapper = styled.div<{ isActive: boolean }>`
  width: 24px;
  height: 24px;
  filter: ${({ isActive }) => `grayscale(${isActive ? 0 : 1})`};
  opacity: ${({ isActive }) => (isActive ? '1' : '0.5')};
`
function RippleAnimation({ isActive, rippleColor }: { isActive: boolean; rippleColor?: string }) {
  if (!isActive || !rippleColor) {
    return null
  }
  return (
    <>
      <Ring width="1px" color={rippleColor} animation={innerRingAnimation} />
      <Ring width="0.5px" color={rippleColor} animation={outerRingAnimation} />
    </>
  )
}
function Icon({ stepStatus, icon, rippleColor }: { stepStatus: StepStatus; icon: ReactElement; rippleColor?: string }) {
  if (stepStatus === StepStatus.IN_PROGRESS) {
    return <LoaderV3 size="24px" fill={rippleColor} />
  }
  return (
    <>
      <RippleAnimation isActive={stepStatus === StepStatus.ACTIVE} rippleColor={rippleColor} />
      <IconWrapper isActive={stepStatus === StepStatus.ACTIVE}>{icon}</IconWrapper>
    </>
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
      return <ThemedText.BodySecondary>{stepDetails.previewTitle}</ThemedText.BodySecondary>
    case StepStatus.ACTIVE:
      return isTimeRemaining ? (
        <ThemedText.BodyPrimary>{stepDetails.actionRequiredTitle}</ThemedText.BodyPrimary>
      ) : (
        <ThemedText.BodyPrimary>{stepDetails.delayedStartTitle}</ThemedText.BodyPrimary>
      )
    case StepStatus.IN_PROGRESS:
      return isTimeRemaining ? (
        <ThemedText.BodyPrimary>{stepDetails.inProgressTitle}</ThemedText.BodyPrimary>
      ) : (
        <ThemedText.BodyPrimary>{stepDetails.delayedEndTitle}</ThemedText.BodyPrimary>
      )
    case StepStatus.COMPLETE:
      return <ThemedText.BodySecondary>{stepDetails.previewTitle}</ThemedText.BodySecondary>
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
  return <ThemedText.BodySecondary paddingRight="8px">{timerText}</ThemedText.BodySecondary>
}

export function Step({ stepStatus, stepDetails }: { stepStatus: StepStatus; stepDetails: StepDetails }) {
  // Timer is shown in three cases:
  // (1) User has a specified amount of time to perform a required action. Timer starts running as soon as the step becomes active.
  // (2) Step has an estimated amount of time in which it should be completed. Timer is set but not running when step becomes active.
  // (3) Step has an estimated amount of time in which it should be completed. Timer starts running when step is in progress.
  const isTimed =
    (stepStatus === StepStatus.ACTIVE && Boolean(stepDetails.timeToStart)) ||
    (stepStatus === StepStatus.ACTIVE && Boolean(stepDetails.timeToEnd)) ||
    (stepStatus === StepStatus.IN_PROGRESS && Boolean(stepDetails.timeToEnd))
  const [secondsRemaining, setSecondsRemaining] = useState(0)

  useEffect(() => {
    if (stepStatus === StepStatus.ACTIVE && Boolean(stepDetails.timeToStart)) {
      setSecondsRemaining(stepDetails.timeToStart ?? 0)
    } else if (stepStatus === StepStatus.ACTIVE && Boolean(stepDetails.timeToEnd)) {
      setSecondsRemaining(stepDetails.timeToEnd ?? 0)
      return
    } else if (stepStatus === StepStatus.IN_PROGRESS) {
      setSecondsRemaining(stepDetails.timeToEnd ?? 0)
    } else {
      return
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prevSecondsRemaining) => {
        if (prevSecondsRemaining > 0) {
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
        <Title stepStatus={stepStatus} stepDetails={stepDetails} isTimeRemaining={isTimed && secondsRemaining > 0} />
      </Row>
      {isTimed && <Timer secondsRemaining={secondsRemaining} />}
      {stepStatus === StepStatus.COMPLETE && <CheckMark />}
    </RowBetween>
  )
}
