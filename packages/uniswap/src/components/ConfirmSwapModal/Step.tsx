import { ReactElement, useEffect, useState } from 'react'
import { Anchor, ColorTokens, Flex, SpinningLoader, Text } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { PulseRipple } from 'ui/src/loading/PulseRipple'
import { fonts, iconSizes, spacing } from 'ui/src/theme'

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

export enum StepStatus {
  Preview,
  Active,
  InProgress,
  Complete,
}

function Icon({
  stepStatus,
  icon,
  rippleColor,
}: {
  stepStatus: StepStatus
  icon: ReactElement
  rippleColor?: string
}): JSX.Element {
  if (stepStatus === StepStatus.InProgress) {
    return (
      <Flex mr={3}>
        <SpinningLoader color={rippleColor as ColorTokens} size={21} />
      </Flex>
    )
  }
  return (
    <Flex>
      {stepStatus === StepStatus.Active && <PulseRipple rippleColor={rippleColor} />}
      <Flex
        data-testid="step-icon"
        filter={stepStatus === StepStatus.Active ? 'grayscale(0)' : 'grayscale(1)'}
        height="$spacing24"
        opacity={stepStatus === StepStatus.Active ? 1 : 0.5}
        width="$spacing24"
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
}): JSX.Element | null {
  switch (stepStatus) {
    case StepStatus.Preview:
      return (
        <Text color="$neutral2" variant="body3">
          {stepDetails.previewTitle}
        </Text>
      )
    case StepStatus.Active:
      return (
        <Text color="$neutral1" variant="body3">
          {isTimeRemaining ? stepDetails.actionRequiredTitle : stepDetails.delayedStartTitle}
        </Text>
      )
    case StepStatus.InProgress:
      return (
        <Text color="$neutral1" variant="body3">
          {isTimeRemaining ? stepDetails.inProgressTitle : null}
        </Text>
      )
    case StepStatus.Complete:
      return (
        <Text color="$neutral2" variant="body3">
          {stepDetails.previewTitle}
        </Text>
      )
    default:
      return null
  }
}

function Timer({ secondsRemaining }: { secondsRemaining: number }): JSX.Element {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const minutesText = minutes < 10 ? `0${minutes}` : minutes
  const secondsText = seconds < 10 ? `0${seconds}` : seconds
  const timerText = `${minutesText}:${secondsText}`
  return (
    <Text data-testid="step-timer" fontSize={14} fontWeight="500" pr={8}>
      {timerText}
    </Text>
  )
}

export function Step({ stepStatus, stepDetails }: { stepStatus: StepStatus; stepDetails: StepDetails }): JSX.Element {
  // Timer is shown in two cases:
  // (1) User has a specified amount of time to perform a required action. Timer starts running as soon as the step becomes active.
  // (2) Step has an estimated amount of time in which it should be completed. Timer starts running when step is in progress.
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  useEffect(() => {
    if (stepStatus === StepStatus.Active && stepDetails?.timeToStart) {
      setSecondsRemaining(stepDetails.timeToStart)
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

    return (): void => clearInterval(timer)
  }, [stepStatus, stepDetails.timeToStart])

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex row alignItems="center" gap="$gap12" height="$spacing40" justifyContent="space-between" py={8}>
        <Icon icon={stepDetails.icon} rippleColor={stepDetails.rippleColor} stepStatus={stepStatus} />
        <Flex>
          <Title
            isTimeRemaining={secondsRemaining === null || secondsRemaining > 0}
            stepDetails={stepDetails}
            stepStatus={stepStatus}
          />
          {stepStatus === StepStatus.Active && stepDetails.learnMoreLinkHref && stepDetails.learnMoreLinkText && (
            <Anchor
              color="$accent1"
              fontSize={fonts.body4.fontSize}
              href={stepDetails.learnMoreLinkHref}
              lineHeight={spacing.spacing16}
              target="_blank"
              textDecorationLine="none"
            >
              {stepDetails.learnMoreLinkText}
            </Anchor>
          )}
        </Flex>
      </Flex>
      {secondsRemaining !== null && <Timer secondsRemaining={secondsRemaining} />}
      {stepStatus === StepStatus.Complete && <Check color="$statusSuccess" size={iconSizes.icon16} />}
    </Flex>
  )
}
