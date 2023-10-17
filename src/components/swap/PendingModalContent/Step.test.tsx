import { Swap } from 'components/Icons/Swap'
import { act, render, screen } from 'test-utils/render'

import { Step, StepStatus } from './Step'

describe('Step in swap confirmation flow', () => {
  const stepDetails = {
    icon: <Swap />,
    rippleColor: '#4C82FB',
    previewTitle: 'Confirm swap',
    actionRequiredTitle: 'Confirm swap in wallet',
    inProgressTitle: 'Swap pending...',
    learnMoreLinkText: 'What is a transaction?',
    learnMoreLinkHref: 'https://support.uniswap.org/what-is-a-transaction',
  }

  it('displays an upcoming step', () => {
    const { asFragment } = render(<Step stepStatus={StepStatus.PREVIEW} stepDetails={stepDetails} />)

    expect(asFragment()).toMatchSnapshot()
    // Icon is shown and grayed out
    expect(screen.getByTestId('step-icon')).toHaveStyleRule('filter', 'grayscale(1)')
    // No ripple animation
    expect(screen.queryByTestId('icon-ripple-animation')).not.toBeInTheDocument()
    // Preview title shown
    expect(screen.getByText(stepDetails.previewTitle)).toBeInTheDocument()
    // No timer or checkmark icon
    expect(screen.queryByTestId('step-timer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('checkmark-icon')).not.toBeInTheDocument()
  })

  it('displays an active step, awaiting user action - not timed and no ETA', () => {
    const { asFragment } = render(<Step stepStatus={StepStatus.ACTIVE} stepDetails={stepDetails} />)

    expect(asFragment()).toMatchSnapshot()
    // Icon is shown and not grayed out
    expect(screen.getByTestId('step-icon')).toHaveStyleRule('filter', 'grayscale(0)')
    // Ripple animation is active
    expect(screen.getByTestId('icon-ripple-animation').firstChild).toHaveAttribute('color', stepDetails.rippleColor)
    // Action Required title is shown
    expect(screen.getByText(stepDetails.actionRequiredTitle)).toBeInTheDocument()
    // No timer or checkmark icon
    expect(screen.queryByTestId('step-timer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('checkmark-icfon')).not.toBeInTheDocument()
  })

  it('displays an active step, awaiting user action - timed', async () => {
    const TIME_TO_START = 20
    const DELAYED_START_TITLE = 'Confirmation timed out. Please retry.'
    jest.useFakeTimers()

    const { asFragment } = render(
      <Step
        stepStatus={StepStatus.ACTIVE}
        stepDetails={{
          ...stepDetails,
          timeToStart: TIME_TO_START,
          delayedStartTitle: DELAYED_START_TITLE,
        }}
      />
    )

    expect(asFragment()).toMatchSnapshot()
    // Icon is shown and not grayed out
    expect(screen.getByTestId('step-icon')).toHaveStyleRule('filter', 'grayscale(0)')
    // Ripple animation is active
    expect(screen.getByTestId('icon-ripple-animation').firstChild).toHaveAttribute('color', stepDetails.rippleColor)
    // Action Required title is shown
    expect(screen.getByText(stepDetails.actionRequiredTitle)).toBeInTheDocument()
    // Timer is shown and functional
    expect(screen.getByText('00:20')).toBeInTheDocument()
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(screen.getByText('00:15')).toBeInTheDocument()
    act(() => {
      jest.advanceTimersByTime(15000)
    })
    expect(screen.getByTestId('step-timer')).toHaveTextContent('00:00')
    expect(screen.getByText(DELAYED_START_TITLE)).toBeInTheDocument()
    expect(screen.queryByTestId('checkmark-icon')).not.toBeInTheDocument()
  })

  it('displays an active step, ETA only', async () => {
    const TIME_TO_END = 20
    const DELAYED_END_TITLE = 'Longer than expected...'
    jest.useFakeTimers()

    const { asFragment } = render(
      <Step
        stepStatus={StepStatus.ACTIVE}
        stepDetails={{
          ...stepDetails,
          timeToEnd: TIME_TO_END,
          delayedEndTitle: DELAYED_END_TITLE,
        }}
      />
    )

    expect(asFragment()).toMatchSnapshot()
    // Icon is shown and not grayed out
    expect(screen.getByTestId('step-icon')).toHaveStyleRule('filter', 'grayscale(0)')
    // Ripple animation is active
    expect(screen.getByTestId('icon-ripple-animation').firstChild).toHaveAttribute('color', stepDetails.rippleColor)
    // Action Required title is shown
    expect(screen.getByText(stepDetails.actionRequiredTitle)).toBeInTheDocument()
    // Timer is shown and preview only
    expect(screen.getByText('00:20')).toBeInTheDocument()
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(screen.getByText('00:20')).toBeInTheDocument()
    expect(screen.queryByText(DELAYED_END_TITLE)).not.toBeInTheDocument()
    expect(screen.queryByTestId('checkmark-icon')).not.toBeInTheDocument()
  })

  it('displays an active step in progress', async () => {
    const TIME_TO_END = 20
    const DELAYED_END_TITLE = 'Longer than expected...'
    jest.useFakeTimers()

    const { asFragment } = render(
      <Step
        stepStatus={StepStatus.IN_PROGRESS}
        stepDetails={{
          ...stepDetails,
          timeToEnd: TIME_TO_END,
          delayedEndTitle: DELAYED_END_TITLE,
        }}
      />
    )

    expect(asFragment()).toMatchSnapshot()
    // Loader icon is shown
    expect(screen.getByTestId('loader-icon')).toHaveAttribute('fill', stepDetails.rippleColor)
    // Action Required title is shown
    expect(screen.getByText(stepDetails.inProgressTitle)).toBeInTheDocument()
    // Timer is shown and functional
    expect(screen.getByText('00:20')).toBeInTheDocument()
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(screen.getByText('00:15')).toBeInTheDocument()
    act(() => {
      jest.advanceTimersByTime(15000)
    })
    expect(screen.getByTestId('step-timer')).toHaveTextContent('00:00')
    expect(screen.getByText(DELAYED_END_TITLE)).toBeInTheDocument()
    expect(screen.queryByTestId('checkmark-icon')).not.toBeInTheDocument()
  })

  it('displays checkmark once step is complete', () => {
    const { asFragment } = render(<Step stepStatus={StepStatus.COMPLETE} stepDetails={stepDetails} />)

    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByTestId('step-icon')).toBeInTheDocument()
    expect(screen.getByText(stepDetails.previewTitle)).toBeInTheDocument()
    expect(screen.queryByTestId('step-timer')).not.toBeInTheDocument()
    expect(screen.getByTestId('checkmark-icon')).toBeInTheDocument()
  })
})
