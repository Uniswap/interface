import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { SharedCreateModals } from '~/pages/CreatePosition/SharedCreateModals'
import { render, screen } from '~/test-utils/render'

vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))
vi.mock('~/state/multichain/useMultichainContext', () => ({ useMultichainContext: () => ({ chainId: 1 }) }))
// Stubbed so mounting alone is what's observed: the real fee-tier and hook modals run their ListPools
// and hook-registry queries while mounted, open or not, which is what the step gate exists to avoid.
vi.mock('~/features/Liquidity/FeeTierSearchModal', () => ({
  FeeTierSearchModal: () => <div data-testid="fee-tier-search-modal" />,
}))
vi.mock('~/features/Liquidity/HookSearchModal', () => ({
  HookSearchModal: () => <div data-testid="hook-search-modal" />,
}))
vi.mock('~/features/Liquidity/Create/DynamicFeeTierSpeedbump', () => ({
  DynamicFeeTierSpeedbump: () => <div data-testid="dynamic-fee-tier-speedbump" />,
}))
vi.mock('~/pages/CreatePosition/HookReviewGate', () => ({
  HookReviewGate: () => <div data-testid="hook-review-gate" />,
}))

const SELECT_STEP_MODAL_TEST_IDS = ['fee-tier-search-modal', 'hook-search-modal', 'dynamic-fee-tier-speedbump']

function mockCreateLiquidityContext(step: PositionFlowStep): void {
  vi.mocked(useCreateLiquidityContext).mockReturnValue({
    positionState: { fee: undefined, protocolVersion: ProtocolVersion.V4, hook: undefined },
    currencies: { display: { TOKEN0: undefined, TOKEN1: undefined }, sdk: { TOKEN0: undefined, TOKEN1: undefined } },
    step,
    setStep: vi.fn(),
    setPositionState: vi.fn(),
    setSelectedHookEntry: vi.fn(),
    feeTierSearchModalOpen: false,
    setFeeTierSearchModalOpen: vi.fn(),
    hookSearchModalOpen: false,
    setHookSearchModalOpen: vi.fn(),
    setDynamicFeeTierSpeedbumpData: vi.fn(),
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
}

describe('SharedCreateModals', () => {
  it('mounts the fee-tier, hook, and dynamic-fee modals on the select step', () => {
    mockCreateLiquidityContext(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
    render(<SharedCreateModals />)
    for (const testId of SELECT_STEP_MODAL_TEST_IDS) {
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    }
  })

  it.each([
    ['range', PositionFlowStep.PRICE_RANGE],
    ['deposit', PositionFlowStep.DEPOSIT],
  ])('mounts none of them on the %s step, where nothing can open them', (_label, step) => {
    mockCreateLiquidityContext(step)
    render(<SharedCreateModals />)
    for (const testId of SELECT_STEP_MODAL_TEST_IDS) {
      expect(screen.queryByTestId(testId)).toBeNull()
    }
  })

  it.each([
    ['select', PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER],
    ['range', PositionFlowStep.PRICE_RANGE],
    ['deposit', PositionFlowStep.DEPOSIT],
  ])('keeps the hook review gate mounted on the %s step, since it runs past the select step', (_label, step) => {
    mockCreateLiquidityContext(step)
    render(<SharedCreateModals />)
    expect(screen.getByTestId('hook-review-gate')).toBeInTheDocument()
  })
})
