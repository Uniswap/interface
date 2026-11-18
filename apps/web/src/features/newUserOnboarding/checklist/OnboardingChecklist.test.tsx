import { TestID } from '@universe/test'
import { OnboardingChecklistStepId } from 'uniswap/src/features/onboarding/checklist/onboardingChecklist'
import { OnboardingChecklist } from '~/features/newUserOnboarding/checklist/OnboardingChecklist'
import {
  type OnboardingChecklistController,
  useOnboardingChecklist,
} from '~/features/newUserOnboarding/checklist/useOnboardingChecklist'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('~/features/newUserOnboarding/checklist/useOnboardingChecklist')

function mockChecklist(overrides: Partial<OnboardingChecklistController> = {}): OnboardingChecklistController {
  const checklist: OnboardingChecklistController = {
    isVisible: true,
    steps: [
      { id: OnboardingChecklistStepId.CreateAccount, isDone: true },
      { id: OnboardingChecklistStepId.FundWallet, isDone: false },
      { id: OnboardingChecklistStepId.CompleteSwap, isDone: false },
    ],
    completedCount: 1,
    isComplete: false,
    isExpanded: false,
    toggleExpanded: vi.fn(),
    onStepPress: vi.fn(),
    ...overrides,
  }
  mocked(useOnboardingChecklist).mockReturnValue(checklist)
  return checklist
}

describe(OnboardingChecklist, () => {
  it('offsets the card by the mWeb bottom inset', () => {
    mockChecklist()
    render(<OnboardingChecklist />)

    const card = screen.getByTestId(TestID.OnboardingChecklist)
    expect(card.classList.contains('bottom-[var(--c-bottom)]')).toBe(true)
    // Independent literal, deliberately not derived from MWEB_BOTTOM_INSET, so a silent change fails here.
    expect(card.style.getPropertyValue('--c-bottom')).toBe('calc(16px + var(--mweb-bottom-inset, 0px))')
  })

  it('renders nothing when hidden', () => {
    mockChecklist({ isVisible: false })
    render(<OnboardingChecklist />)

    expect(screen.queryByTestId(TestID.OnboardingChecklist)).not.toBeInTheDocument()
  })

  it('shows only the header while collapsed and toggles on press', () => {
    const checklist = mockChecklist()
    render(<OnboardingChecklist />)

    expect(screen.getByText('Getting started')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.OnboardingChecklistToggle)).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(screen.getByTestId(TestID.OnboardingChecklistToggle))
    expect(checklist.toggleExpanded).toHaveBeenCalledTimes(1)
  })

  it('opens a step when an unfinished row is pressed', () => {
    const checklist = mockChecklist({ isExpanded: true })
    render(<OnboardingChecklist />)

    fireEvent.click(screen.getByText('Fund your wallet'))
    expect(checklist.onStepPress).toHaveBeenCalledWith(OnboardingChecklistStepId.FundWallet)

    fireEvent.click(screen.getByText('Create account'))
    expect(checklist.onStepPress).toHaveBeenCalledTimes(1)
  })
})
