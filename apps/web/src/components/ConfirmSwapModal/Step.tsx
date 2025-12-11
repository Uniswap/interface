import { CheckMark } from 'components/Icons/CheckMark'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import { deprecatedStyled, keyframes } from 'lib/styled-components'
import { ReactElement, useEffect, useState } from 'react'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'
import { Flex } from 'ui/src'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'

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
const Ring = deprecatedStyled.div<{ $borderColor: string; $animation: ReturnType<typeof keyframes> }>`
  position: absolute;
  width: ${ICON_SIZE}px;
  height: ${ICON_SIZE}px;
  border: 1px solid ${({ $borderColor }) => $borderColor};
  border-radius: 50%;
  animation: ${({ $animation }) => $animation} 1.5s linear infinite;
`

function RippleAnimation({ rippleColor }: { rippleColor?: string }) {
  if (!rippleColor) {
    return null
  }
  return (
    <Flex data-testid="icon-ripple-animation">
      <Ring $borderColor={rippleColor} $animation={ringAnimation} />
    </Flex>
  )
}

function Icon({ stepStatus, icon, rippleColor }: { stepStatus: StepStatus; icon: ReactElement; rippleColor?: string }) {
  const isActive = stepStatus === StepStatus.Active
  if (stepStatus === StepStatus.InProgress) {
    return <LoaderV3 size={`${ICON_SIZE}px`} stroke={rippleColor} fill={rippleColor} data-testid="loader-icon" />
  }
  return (
    <Flex>
      {isActive && <RippleAnimation rippleColor={rippleColor} />}
      <Flex
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
      return <ThemedText.LabelSmall>{stepDetails.previewTitle}</ThemedText.LabelSmall>
    case StepStatus.Active:
      return (
        <ThemedText.BodySmall>
          {isTimeRemaining ? stepDetails.actionRequiredTitle : stepDetails.delayedStartTitle}
        </ThemedText.BodySmall>
      )
    case StepStatus.InProgress:
      return <ThemedText.BodySmall>{isTimeRemaining ? stepDetails.inProgressTitle : null}</ThemedText.BodySmall>
    case StepStatus.Complete:
      return <ThemedText.LabelSmall>{stepDetails.previewTitle}</ThemedText.LabelSmall>
    default:
      return null
  }
}

const MonospacedTimer = deprecatedStyled(ThemedText.LabelSmall)`
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

const StyledExternalLink = deprecatedStyled(ExternalLink)`
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
            <StyledExternalLink href={stepDetails.learnMoreLinkHref || ''}>
              {stepDetails.learnMoreLinkText}
            </StyledExternalLink>
          )}
        </Flex>
      </Flex>
      {secondsRemaining !== null && <Timer secondsRemaining={secondsRemaining} />}
      {stepStatus === StepStatus.Complete && <CheckMark />}
    </Flex>
  )
}
