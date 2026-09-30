import { fireEvent } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { TestID } from '@universe/test'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { PositionFlowStep, type PositionState } from '~/features/Liquidity/Create/types'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { HookReviewGate } from '~/pages/CreatePosition/HookReviewGate'
import { render, screen } from '~/test-utils/render'

vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))

// The real Modal is a Radix dialog / bottom sheet; render straight through like the other modal specs.
// `isDismissible` is surfaced so the locked backdrop is observable.
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({
    children,
    isModalOpen,
    isDismissible,
  }: {
    children: React.ReactNode
    isModalOpen: boolean
    isDismissible?: boolean
  }) =>
    isModalOpen ? (
      <div data-testid="hook-modal" data-dismissible={String(isDismissible ?? true)}>
        {children}
      </div>
    ) : null,
}))

const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)

// Last two hex bytes are the v4 permission flags; 0x0080 = beforeSwap, which is informational only.
const HOOK = '0x1111111111111111111111111111111111110080'

const setPositionState = vi.fn()

function mockContext({ step, ...positionState }: Partial<PositionState> & { step: PositionFlowStep }): void {
  mockedUseCreateLiquidityContext.mockReturnValue({
    positionState: {
      hook: undefined,
      userApprovedHook: undefined,
      protocolVersion: ProtocolVersion.V4,
      ...positionState,
    },
    setPositionState,
    step,
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
}

function renderGate(): { onDecline: ReturnType<typeof vi.fn> } {
  const onDecline = vi.fn()
  render(<HookReviewGate onDecline={onDecline} />)
  return { onDecline }
}

const modalTitle = (): HTMLElement | null => screen.queryByText('Adding hook')

describe('HookReviewGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // SelectTokensStep owns the review on its own step; a second mount there would show two modals.
  it('renders nothing on the token-select step even with an unreviewed hook', () => {
    mockContext({ step: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER, hook: HOOK })
    renderGate()
    expect(modalTitle()).not.toBeInTheDocument()
  })

  it.each([PositionFlowStep.PRICE_RANGE, PositionFlowStep.DEPOSIT])(
    'opens the unchanged review on step %s when the hook was never reviewed',
    (step) => {
      mockContext({ step, hook: HOOK })
      renderGate()
      expect(modalTitle()).toBeInTheDocument()
      expect(
        screen.getByText(
          'Adding hooks may have unintended consequences. Do your research and proceed at your own risk.',
        ),
      ).toBeInTheDocument()
      expect(screen.getByText('Go back')).toBeInTheDocument()
      expect(screen.queryByText('Remove hook')).not.toBeInTheDocument()
    },
  )

  // A stray backdrop click must not read as consent: this is the only review on these paths.
  it('locks the backdrop', () => {
    mockContext({ step: PositionFlowStep.PRICE_RANGE, hook: HOOK })
    renderGate()
    expect(screen.getByTestId('hook-modal')).toHaveAttribute('data-dismissible', 'false')
  })

  // The normal path records the approval on the token-select step's Continue, so the user who walked
  // through the flow never sees the review a second time.
  it('stays closed once the hook has been approved', () => {
    mockContext({ step: PositionFlowStep.PRICE_RANGE, hook: HOOK, userApprovedHook: HOOK })
    renderGate()
    expect(modalTitle()).not.toBeInTheDocument()
  })

  it('treats a missing or zero hook as nothing to review', () => {
    mockContext({ step: PositionFlowStep.PRICE_RANGE, hook: ZERO_ADDRESS })
    renderGate()
    expect(modalTitle()).not.toBeInTheDocument()
  })

  it('ignores a hook on a protocol that has none', () => {
    mockContext({ step: PositionFlowStep.PRICE_RANGE, hook: HOOK, protocolVersion: ProtocolVersion.V3 })
    renderGate()
    expect(modalTitle()).not.toBeInTheDocument()
  })

  it('records the approval on Continue and does not decline', () => {
    mockContext({ step: PositionFlowStep.PRICE_RANGE, hook: HOOK })
    const { onDecline } = renderGate()

    fireEvent.click(screen.getByText('Continue'))

    const update = setPositionState.mock.calls[0][0] as (state: PositionState) => PositionState
    expect(update({ hook: HOOK } as PositionState).userApprovedHook).toBe(HOOK)
    expect(onDecline).not.toHaveBeenCalled()
  })

  it.each([
    ['Go back', () => screen.getByText('Go back')],
    ['the header X', () => screen.getByTestId(TestID.HookModalClose)],
  ])('declines on %s without recording an approval', (_label, getControl) => {
    mockContext({ step: PositionFlowStep.PRICE_RANGE, hook: HOOK })
    const { onDecline } = renderGate()

    fireEvent.click(getControl())

    expect(onDecline).toHaveBeenCalledTimes(1)
    expect(setPositionState).not.toHaveBeenCalled()
  })
})
