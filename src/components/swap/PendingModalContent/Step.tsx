import { CheckMark } from 'components/Icons/CheckMark'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import Row from 'components/Row'
import { ReactElement, useEffect, useState } from 'react'
import styled, { Keyframes, keyframes, useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'

export interface StepDetails {
  icon: ReactElement
  rippleColor: string
  previewTitle: string
  actionRequiredTitle: string
  inProgressTitle?: string
  delayedTitle?: string
  timerValueInSeconds?: number
  learnMoreLinkText?: string
  learnMoreLinkHref?: string
}

export enum StepStatus {
  PREVIEW,
  ACTIVE,
  IN_PROGRESS,
  COMPLETE,
}
const rippleAnimation = keyframes`
  0% {
    transform: scale(0);
    border-width: 2px;
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    border-width: 1px;
    opacity: 0.75;
  }
  100% {
    transform: scale(1.4);
    border-width: 0.5px;
    opacity: 0.5;
  }
`
const outerRingAnimation = keyframes`
  0% {
    transform: scale(1.4);
    opacity: 0.25;
  }
  50% {
    transform: scale(1.5);
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
  filter: ${({ isActive }) => `grayscale(${isActive ? 0 : 1})`};
`
function Icon({ stepStatus, icon, rippleColor }: { stepStatus: StepStatus; icon: ReactElement; rippleColor: string }) {
  const theme = useTheme()
  if (stepStatus === StepStatus.IN_PROGRESS) {
    return <LoaderV3 size="24px" fill={theme.neutral1} />
  }
  const isActive = stepStatus === StepStatus.ACTIVE
  return (
    <div style={{ textAlign: 'center' }}>
      {isActive && (
        <>
          <Ring width="1px" color={rippleColor} animation={innerRingAnimation} />
          <Ring width="0.5px" color={rippleColor} animation={outerRingAnimation} />
        </>
      )}
      <IconWrapper isActive={isActive}>{icon}</IconWrapper>
    </div>
  )
}

function Title({
  stepStatus,
  stepDetails,
  isTimeElapsed,
}: {
  stepStatus: StepStatus
  stepDetails: StepDetails
  isTimeElapsed: boolean
}) {
  switch (stepStatus) {
    case StepStatus.PREVIEW:
      return <ThemedText.BodySecondary>{stepDetails.previewTitle}</ThemedText.BodySecondary>
    case StepStatus.ACTIVE:
      return <ThemedText.BodyPrimary>{stepDetails.actionRequiredTitle}</ThemedText.BodyPrimary>
    case StepStatus.IN_PROGRESS:
      return isTimeElapsed ? (
        <ThemedText.BodyPrimary>{stepDetails.delayedTitle}</ThemedText.BodyPrimary>
      ) : (
        <ThemedText.BodyPrimary>{stepDetails.inProgressTitle}</ThemedText.BodyPrimary>
      )
    case StepStatus.COMPLETE:
      return <ThemedText.BodySecondary>{stepDetails.previewTitle}</ThemedText.BodySecondary>
    default:
      return <></>
  }
}

function Timer({ stepStatus, secondsRemaining }: { stepStatus: StepStatus; secondsRemaining: number }) {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  if (!(stepStatus === StepStatus.ACTIVE || stepStatus === StepStatus.IN_PROGRESS)) {
    return <></>
  }
  return stepStatus === StepStatus.IN_PROGRESS ? (
    <ThemedText.BodyPrimary>
      {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
    </ThemedText.BodyPrimary>
  ) : (
    <ThemedText.BodySecondary>
      {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
    </ThemedText.BodySecondary>
  )
}

export function Step({ stepStatus, stepDetails }: { stepStatus: StepStatus; stepDetails: StepDetails }) {
  const [secondsRemaining, setSecondsRemaining] = useState(stepDetails.timerValueInSeconds ?? 0)

  useEffect(() => {
    const timer = setInterval(() => {
      if (stepStatus !== StepStatus.IN_PROGRESS) {
        return
      }
      setSecondsRemaining((prevSecondsRemaining) => {
        if (prevSecondsRemaining > 0) {
          return prevSecondsRemaining - 1
        }
        clearInterval(timer)
        return 0
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [stepStatus])

  return (
    <Row justifyContent="space-between">
      <Row gap="12px" align="center">
        <Icon stepStatus={stepStatus} icon={stepDetails.icon} rippleColor={stepDetails.rippleColor} />
        <Title stepStatus={stepStatus} stepDetails={stepDetails} isTimeElapsed={secondsRemaining === 0} />
      </Row>
      {stepDetails.timerValueInSeconds && <Timer stepStatus={stepStatus} secondsRemaining={secondsRemaining} />}
      {stepStatus === StepStatus.COMPLETE && <CheckMark />}
    </Row>
  )
}
