import { Fragment, ReactElement, useEffect, useState } from 'react'
import { Flex, styled, Text } from 'ui/src'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { CheckMark } from '~/components/Icons/CheckMark'
import { LoaderV3 } from '~/components/Icons/LoadingSpinner'
import { ExternalLink } from '~/theme/components/Links'

export const ICON_SIZE = 24

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
  // Anchor text displayed for the Learn-More link
  learnMoreLinkText?: string
  // URL for Learn-More link (opened in new tab)
  learnMoreLinkHref?: string
}

const Ring = styled(Flex, {
  position: 'absolute',
  top: 0,
  left: 0,
  width: ICON_SIZE,
  height: ICON_SIZE,
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: '$roundedFull',
  pointerEvents: 'none',
  zIndex: 0,

  '$platform-web': {
    transformOrigin: 'center',
    animationName: 'limitConfirmStepRingPulse',
    animationDuration: '1.5s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
})

function Icon({ stepStatus, icon, rippleColor }: { stepStatus: StepStatus; icon: ReactElement; rippleColor?: string }) {
  const isActive = stepStatus === StepStatus.Active
  if (stepStatus === StepStatus.InProgress) {
    return <LoaderV3 size={`${ICON_SIZE}px`} stroke={rippleColor} fill={rippleColor} data-testid="loader-icon" />
  }
  return (
    <Flex centered position="relative" width={ICON_SIZE} height={ICON_SIZE}>
      {isActive && rippleColor && <Ring data-testid="icon-ripple-animation" style={{ borderColor: rippleColor }} />}
      <Flex
        centered
        zIndex={1}
        height={ICON_SIZE}
        width={ICON_SIZE}
        filter={isActive ? 'grayscale(0)' : 'grayscale(1)'}
        data-testid="step-icon"
      >
        {icon}
      </Flex>
    </Flex>
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
    case StepStatus.Preview:
      return (
        <Text variant="body3" color="$neutral2">
          {stepDetails.previewTitle}
        </Text>
      )
    case StepStatus.Active:
      return (
        <Text variant="body3">{isTimeRemaining ? stepDetails.actionRequiredTitle : stepDetails.delayedStartTitle}</Text>
      )
    case StepStatus.InProgress:
      return <Text variant="body3">{isTimeRemaining ? stepDetails.inProgressTitle : null}</Text>
    case StepStatus.Complete:
      return (
        <Text variant="body3" color="$neutral2">
          {stepDetails.previewTitle}
        </Text>
      )
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
    <Text
      variant="body3"
      color="$neutral2"
      paddingRight="$spacing8"
      data-testid="step-timer"
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {timerText}
    </Text>
  )
}

export function Step({ stepStatus, stepDetails }: { stepStatus: StepStatus; stepDetails: StepDetails }) {
  // Timer is shown in two cases:
  // (1) User has a specified amount of time to perform a required action. Timer starts running as soon as the step becomes active.
  // (2) Step has an estimated amount of time in which it should be completed. Timer starts running when step is in progress.
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  useEffect(() => {
    if (stepStatus === StepStatus.Active && stepDetails.timeToStart) {
      setSecondsRemaining(stepDetails.timeToStart)
    } else {
      setSecondsRemaining(null)
      return undefined
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
  }, [stepStatus, stepDetails.timeToStart])

  return (
    <Fragment>
      <Flex row pr="$spacing16" justifyContent="space-between">
        <Flex row centered gap="$gap12" height={40} px="$spacing8" py="$spacing16">
          <Icon stepStatus={stepStatus} icon={stepDetails.icon} rippleColor={stepDetails.rippleColor} />
          <Flex>
            <Title
              stepStatus={stepStatus}
              stepDetails={stepDetails}
              isTimeRemaining={secondsRemaining === null || secondsRemaining > 0}
            />
            {stepStatus === StepStatus.Active && stepDetails.learnMoreLinkHref && (
              <ExternalLink href={stepDetails.learnMoreLinkHref || ''}>
                <Text variant="body3">{stepDetails.learnMoreLinkText}</Text>
              </ExternalLink>
            )}
          </Flex>
        </Flex>
        {secondsRemaining !== null && <Timer secondsRemaining={secondsRemaining} />}
        {stepStatus === StepStatus.Complete && <CheckMark />}
      </Flex>
    </Fragment>
  )
}
