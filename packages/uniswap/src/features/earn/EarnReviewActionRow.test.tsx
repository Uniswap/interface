import {
  EarnPlanProgressIndicator,
  type EarnPlanProgressState,
} from 'uniswap/src/features/earn/EarnPlanProgressIndicator'
import { EarnReviewActionRow } from 'uniswap/src/features/earn/EarnReviewActionRow'
import { PendingSwapButtonContent } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/PendingSwapButtonContent'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { noop } from 'utilities/src/react/noop'

const mockPlatform = vi.hoisted(() => ({ isMobileApp: false, isWebApp: true }))
const mockEarnPlanProgressIndicator = vi.hoisted(() => vi.fn(() => null))
const mockPendingSwapButtonContent = vi.hoisted(() => vi.fn(() => null))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isMobileApp(): boolean {
      return mockPlatform.isMobileApp
    },
    get isWebApp(): boolean {
      return mockPlatform.isWebApp
    },
  }
})

vi.mock('uniswap/src/features/earn/EarnPlanProgressIndicator', () => ({
  EarnPlanProgressIndicator: mockEarnPlanProgressIndicator,
}))

vi.mock(
  'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/PendingSwapButtonContent',
  () => ({
    PendingSwapButtonContent: mockPendingSwapButtonContent,
  }),
)

const progressStep = {} as EarnPlanProgressState['steps'][number]
const progress: EarnPlanProgressState = {
  steps: [progressStep],
  currentStepIndex: 0,
  currentStep: { step: progressStep, accepted: false },
}

function renderActionRow(
  progressState: EarnPlanProgressState = progress,
  overrides: Partial<Parameters<typeof EarnReviewActionRow>[0]> = {},
): JSX.Element {
  return EarnReviewActionRow({
    ctaDisabled: true,
    ctaLabel: 'Withdraw',
    isExecuting: true,
    isShortMobileDevice: false,
    progress: progressState,
    retryLabel: 'Retry',
    stepProgressLabel: 'Withdrawing…',
    onBack: vi.fn(),
    onPress: vi.fn(),
    ...overrides,
  })
}

describe(EarnReviewActionRow, () => {
  beforeEach(() => {
    mockPlatform.isMobileApp = false
    mockPlatform.isWebApp = true
  })

  it('shows plan progress in the web app', () => {
    expect(renderActionRow().type).toBe(EarnPlanProgressIndicator)
  })

  it('shows chained-action button progress in the mobile app', () => {
    mockPlatform.isMobileApp = true
    mockPlatform.isWebApp = false

    const result = renderActionRow()

    expect(result.type).toBe(PendingSwapButtonContent)
    expect(result.props).toMatchObject({
      disabled: true,
      currentStepIndex: 1,
      steps: progress.steps,
      submissionText: 'Withdrawing…',
      testID: TestID.EarnReviewAction,
      onSubmit: noop,
    })
  })

  it('offsets the plan step index past the synthetic plan-fetch segment', () => {
    mockPlatform.isMobileApp = true
    mockPlatform.isWebApp = false

    const laterStepProgress: EarnPlanProgressState = {
      ...progress,
      currentStepIndex: 2,
    }

    expect(renderActionRow(laterStepProgress).props.currentStepIndex).toBe(3)
  })

  it('returns the web CTA instead of progress when a retained plan is not executing', () => {
    const stopped = renderActionRow(progress, { isExecuting: false, ctaDisabled: false })

    expect(stopped.type).not.toBe(EarnPlanProgressIndicator)
    expect(stopped.props).toMatchObject({ disabled: false, children: 'Withdraw' })
  })

  it('returns the mobile CTA instead of button progress when a retained plan is not executing', () => {
    mockPlatform.isMobileApp = true
    mockPlatform.isWebApp = false

    const stopped = renderActionRow(progress, { isExecuting: false, ctaDisabled: false })

    expect(stopped.type).not.toBe(PendingSwapButtonContent)
    expect(stopped.type).not.toBe(EarnPlanProgressIndicator)
  })

  it('renders a supplied authentication icon on the mobile confirmation CTA', () => {
    mockPlatform.isMobileApp = true
    mockPlatform.isWebApp = false
    const buttonAuthIcon = <span />

    const actionRow = renderActionRow(progress, {
      ctaDisabled: false,
      buttonAuthIcon,
      isExecuting: false,
    })

    expect(actionRow.props.children[1].props.icon).toBe(buttonAuthIcon)
  })
})
