import { Swap } from 'components/Icons/Swap'
import { useTheme } from 'styled-components'
import { render, screen } from 'test-utils/render'

import { Step, StepStatus } from './Step'

describe('Step in swap confirmation flow', () => {
  const theme = useTheme()
  const stepDetails = {
    isInProgress: false,
    icon: <Swap />,
    rippleColor: theme.accent1,
    previewTitle: 'Confirm swap',
    actionRequiredTitle: 'Confirm swap in wallet',
    inProgressTitle: 'Swap pending...',
    delayedTitle: 'Longer than expected',
    timerValueInSeconds: 30,
    learnMoreLinkText: 'What is a transaction?',
    learnMoreLinkHref: 'https://support.uniswap.org/what-is-a-transaction',
  }

  it('displays an upcoming step', () => {
    const { asFragment } = render(<Step stepStatus={StepStatus.PREVIEW} stepDetails={stepDetails} />)

    expect(asFragment()).toMatchSnapshot()
    // Icon is shown
    expect(screen.getByTestId('confirm-swap-icon')).toBeInTheDocument()
    // No pulse animation
    expect(screen.getByTestId('icon-pulse-animation')).not.toBeInTheDocument()
    // Preview title shown and dimmed
    expect(screen.getByText(stepDetails.previewTitle)).toHaveAttribute('color', theme.neutral2)
    // No timer or checkmark icon or link
    expect(screen.getByTestId('step-timer')).not.toBeInTheDocument()
    expect(screen.getByTestId('checkmark-icon')).not.toBeInTheDocument()
    expect(screen.getByTestId(stepDetails.learnMoreLinkText)).not.toBeInTheDocument()
  })

  it('displays an active step, awaiting user action', () => {
    const { asFragment } = render(<Step stepStatus={StepStatus.ACTIVE} stepDetails={stepDetails} />)

    expect(asFragment()).toMatchSnapshot()
    // Icon is shown
    expect(screen.getByTestId('confirm-swap-icon')).toBeInTheDocument()
    // Pulse animation is active
    expect(screen.getByTestId('icon-pulse-animation')).not.toBeInTheDocument()
    // Action Required title is shown and bright
    expect(screen.getByText(stepDetails.actionRequiredTitle)).toHaveAttribute('color', theme.neutral1)
    // No timer or checkmark icon or link
    expect(screen.getByTestId('step-timer')).not.toBeInTheDocument()
    expect(screen.getByTestId('checkmark-icon')).not.toBeInTheDocument()
    expect(screen.getByTestId(stepDetails.learnMoreLinkText)).not.toBeInTheDocument()
  })

  it('displays an active step in progress', () => {
    const { asFragment } = render(<Step stepStatus={StepStatus.IN_PROGRESS} stepDetails={stepDetails} />)

    expect(asFragment()).toMatchSnapshot()
    // Loader icon is shown and spinning
    expect(screen.getByTestId('loading-icon')).toBeInTheDocument()
    // inProgress title is shown and bright
    expect(screen.getByText(stepDetails.inProgressTitle)).toHaveAttribute('color', theme.neutral1)
    // Timer is shown
    expect(screen.getByTestId('step-timer')).toBeInTheDocument()
    expect(screen.getByTestId('checkmark-icon')).not.toBeInTheDocument()
    // Link is shown
    expect(screen.getByTestId(stepDetails.learnMoreLinkText)).toHaveAttribute('href', stepDetails.learnMoreLinkHref)
  })

  it('displays a delayed message after timer expires', () => {
    const { asFragment } = render(<Step stepStatus={StepStatus.IN_PROGRESS} stepDetails={stepDetails} />)

    expect(asFragment()).toMatchSnapshot()
    // Loader icon is shown and spinning
    expect(screen.getByTestId('loading-icon')).toBeInTheDocument()
    // delayed title is shown and bright
    expect(screen.getByText(stepDetails.delayedTitle)).toHaveAttribute('color', theme.neutral1)
    // Timer is shown and out of time
    expect(screen.getByTestId('step-timer')).toBeInTheDocument()
    expect(screen.getByText('00:00')).toBeInTheDocument()
    // Link is shown
    expect(screen.getByTestId(stepDetails.learnMoreLinkText)).toHaveAttribute('href', stepDetails.learnMoreLinkHref)
  })

  it('displays checkmark once step is complete', () => {
    const { asFragment } = render(<Step stepStatus={StepStatus.IN_PROGRESS} stepDetails={stepDetails} />)

    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByTestId('confirm-swap-icon')).toBeInTheDocument()
    expect(screen.getByText(stepDetails.previewTitle)).toHaveAttribute('color', theme.neutral1)
    expect(screen.getByTestId('step-timer')).not.toBeInTheDocument()
    expect(screen.getByText('checkmark-icon')).toBeInTheDocument()
    expect(screen.getByTestId(stepDetails.learnMoreLinkText)).not.toBeInTheDocument()
  })
})
