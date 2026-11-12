import { fireEvent } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { TestID } from '@universe/test'
import type { ComponentProps } from 'react'
import type { Mock } from 'vitest'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { useBlockedTokens } from '~/features/Liquidity/Create/hooks/useBlockedTokens'
import { SelectTokensStep } from '~/features/Liquidity/Create/SelectTokenStep'
import type { PositionState } from '~/features/Liquidity/Create/types'
import type { HookModal } from '~/features/Liquidity/HookModal'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { render, screen } from '~/test-utils/render'

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => mockNavigate }
})
vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({ useLPGeoRestriction: vi.fn() }))
vi.mock('~/features/Liquidity/Create/hooks/useBlockedTokens', () => ({ useBlockedTokens: vi.fn() }))
vi.mock('~/features/Liquidity/Create/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))
vi.mock('~/features/Liquidity/Create/hooks/useLiquidityUrlState', () => ({
  useLiquidityUrlState: () => ({ loadingA: false, loadingB: false, hook: undefined }),
}))
vi.mock('~/features/Liquidity/Create/hooks/useRecommendedPermissionedHook', () => ({
  useRecommendedHookPrefill: () => undefined,
}))
vi.mock('~/state/multichain/useMultichainContext', () => ({
  useMultichainContext: () => ({ setSelectedChainId: vi.fn(), setIsUserSelectedToken: vi.fn() }),
}))
vi.mock('~/features/Liquidity/hooks/useAllFeeTierPoolData', () => ({
  useAllFeeTierPoolData: () => ({ feeTierData: {}, hasExistingFeeTiers: false }),
}))
vi.mock('~/components/SearchModal/CurrencySearchModal', () => ({ CurrencySearchModal: () => null }))
vi.mock('~/features/Liquidity/HookModal', () => ({
  HookModal: ({ isOpen, onClose, onCancel, onContinue }: ComponentProps<typeof HookModal>) =>
    isOpen ? (
      <div role="dialog" aria-label="Review hook">
        <button onClick={onClose}>Dismiss hook review</button>
        <button onClick={onCancel}>Remove hook</button>
        <button onClick={onContinue}>Continue with hook</button>
      </div>
    ) : null,
}))
vi.mock('~/features/Liquidity/Create/AddHook', () => ({ AddHook: () => <div data-testid="add-hook" /> }))
vi.mock('~/features/Liquidity/Create/PoolParsingError', () => ({ PoolParsingError: () => null }))
vi.mock('~/features/Liquidity/LPIncentives/RewardAprBadge', () => ({ RewardAprBadge: () => null }))
vi.mock('~/features/Liquidity/CurrencySelector', () => ({ CurrencySelector: () => null }))

// Stubbed so the `disabled` prop the step computes from `hasError` is observable; the value asserted
// is the real one SelectTokensStep derives, not a value the stub invents.
vi.mock('~/features/Liquidity/FeeTierSelector', () => ({
  FeeTierSelector: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="fee-tier-selector" data-disabled={String(Boolean(disabled))} />
  ),
}))

const mockedUseLPGeoRestriction = vi.mocked(useLPGeoRestriction)
const mockedUseBlockedTokens = vi.mocked(useBlockedTokens)
const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)

const AAPLX = { symbol: 'AAPLX', chainId: 1, address: '0xaaplx', isNative: false } as Currency
const USDC = { symbol: 'USDC', chainId: 1, address: '0xusdc', isNative: false } as Currency

const CURRENCY_INPUTS = { tokenA: AAPLX, tokenB: USDC }
const HOOK = '0x1111111111111111111111111111111111111111'

beforeEach(() => {
  window.history.replaceState({}, '', '/positions/add/new')
})

function mockGeoRestriction(overrides: Partial<ReturnType<typeof useLPGeoRestriction>>): void {
  mockedUseLPGeoRestriction.mockReturnValue({
    isGeoRestricted: false,
    restrictedTokenSymbol: undefined,
    unavailableLabel: 'Not available in your region',
    ...overrides,
  })
}

interface PoolCase {
  creatingPoolOrPair: boolean
  poolOrPair?: { id: string }
  poolId?: string
}

/**
 * A pair with a fee tier already selected. Whether a pool exists at that tier decides what the CTA
 * does — an existing pool navigates into it, a pool being created advances the form — so each suite
 * pins its own case.
 */
function mockCreateLiquidityContext(
  pool: PoolCase,
  positionOverrides: Partial<PositionState> = {},
): Pick<ReturnType<typeof useCreateLiquidityContext>, 'positionState' | 'setPositionState'> {
  const positionState: PositionState = {
    protocolVersion: ProtocolVersion.V3,
    hook: undefined,
    userApprovedHook: undefined,
    fee: { feeAmount: 3000, tickSpacing: 60, isDynamic: false },
    migratingPosition: undefined,
    ...positionOverrides,
  }
  const setPositionState = vi.fn()
  mockedUseCreateLiquidityContext.mockReturnValue({
    positionState,
    setPositionState,
    protocolVersion: positionState.protocolVersion,
    currencies: { display: { TOKEN0: AAPLX, TOKEN1: USDC }, sdk: { TOKEN0: AAPLX, TOKEN1: USDC } },
    poolOrPairLoading: false,
    protocolFee: undefined,
    setFeeTierSearchModalOpen: vi.fn(),
    ...pool,
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
  return { positionState, setPositionState }
}

const EXISTING_POOL: PoolCase = { creatingPoolOrPair: false, poolOrPair: { id: 'pool-id' }, poolId: 'pool-id' }
/** No pool at the selected tier yet, so the CTA advances the form rather than navigating into one. */
const NEW_POOL: PoolCase = { creatingPoolOrPair: true }

function renderStep(onContinue = vi.fn()): { onContinue: Mock } {
  render(<SelectTokensStep currencyInputs={CURRENCY_INPUTS} setCurrencyInputs={vi.fn()} onContinue={onContinue} />)
  return { onContinue }
}

describe('SelectTokensStep geo gate (select-tokens seam)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateLiquidityContext(NEW_POOL)
    mockedUseBlockedTokens.mockReturnValue({ hasBlockedToken: false, blockedTokenSymbols: [] })
  })

  it('advances on the CTA when the pair is confirmed clean', () => {
    mockGeoRestriction({})
    const { onContinue } = renderStep()

    fireEvent.click(screen.getByText('Continue'))
    expect(onContinue).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId(TestID.LPGeoRestrictionBanner)).toBeNull()
  })

  // Seam A is the earliest block: if this CTA advances, the user reaches the deposit step with a
  // restricted pair already committed.
  it('replaces the CTA with an inert region-unavailable button when the pair is restricted', () => {
    mockGeoRestriction({
      isGeoRestricted: true,
      restrictedTokenSymbol: 'AAPLX',
      unavailableLabel: 'AAPLX unavailable in your region',
    })
    const { onContinue } = renderStep()

    expect(screen.queryByText('Continue')).toBeNull()
    fireEvent.click(screen.getByText('AAPLX unavailable in your region'))
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('shows the geo banner naming the restricted token when restricted', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'AAPLX', unavailableLabel: 'unavailable' })
    renderStep()

    expect(screen.getByTestId(TestID.LPGeoRestrictionBanner)).toBeInTheDocument()
    expect(screen.getByText('AAPLX is unavailable in your region')).toBeInTheDocument()
  })

  it('folds the restriction into hasError so the fee-tier selector is disabled too', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'AAPLX', unavailableLabel: 'unavailable' })
    renderStep()

    expect(screen.getByTestId('fee-tier-selector')).toHaveAttribute('data-disabled', 'true')
  })

  it('leaves the fee-tier selector enabled for a clean pair', () => {
    mockGeoRestriction({})
    renderStep()

    expect(screen.getByTestId('fee-tier-selector')).toHaveAttribute('data-disabled', 'false')
  })

  // The geo block has no remedy, so it replaces the blocked-token callout rather than stacking with
  // it: two competing "not available" messages would leave the user unsure which one applies.
  it('replaces the blocked-token callout with the geo banner when both apply', () => {
    mockedUseBlockedTokens.mockReturnValue({ hasBlockedToken: true, blockedTokenSymbols: ['AAPLX'] })
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'AAPLX', unavailableLabel: 'unavailable' })
    renderStep()

    expect(screen.getByTestId(TestID.LPGeoRestrictionBanner)).toBeInTheDocument()
    expect(screen.queryByText('AAPLX is not available')).toBeNull()
  })

  it('still shows the blocked-token callout when only the token-safety block applies', () => {
    mockedUseBlockedTokens.mockReturnValue({ hasBlockedToken: true, blockedTokenSymbols: ['AAPLX'] })
    mockGeoRestriction({})
    renderStep()

    expect(screen.queryByTestId(TestID.LPGeoRestrictionBanner)).toBeNull()
    expect(screen.getByText('AAPLX is not available')).toBeInTheDocument()
  })

  it('falls back to the generic label when the restricted token has no symbol', () => {
    mockGeoRestriction({
      isGeoRestricted: true,
      restrictedTokenSymbol: undefined,
      unavailableLabel: 'Not available in your region',
    })
    renderStep()

    expect(screen.getByText('Not available in your region')).toBeInTheDocument()
    expect(screen.getByText('This token is unavailable in your region')).toBeInTheDocument()
  })
})

describe('SelectTokensStep existing-pool CTA', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateLiquidityContext(EXISTING_POOL)
    mockGeoRestriction({})
    mockedUseBlockedTokens.mockReturnValue({ hasBlockedToken: false, blockedTokenSymbols: [] })
  })

  // Regression: the CTA once navigated to the pool browser instead of the pool. It carries the pool
  // params but no `step` — AddLiquidity derives the first form step from the pool it loads, and a
  // `step` written here would land in the URL while this page is still mounted, animating it into the
  // range step before the route swaps.
  it('navigates into the pool route with the pool params and no step', () => {
    renderStep()

    fireEvent.click(screen.getByText('Continue'))

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    const target = mockNavigate.mock.calls[0][0] as string
    expect(target).toContain('/positions/add/ethereum/pool-id')
    expect(target).toContain('protocolVersion=v3')
    expect(target).not.toContain('step=')
  })

  // Without `from` the destination's back arrow falls through to the pool browser, stranding users
  // who arrived from the create flow.
  it('marks the create page as the entry so the destination can pop back to it', () => {
    renderStep()

    fireEvent.click(screen.getByText('Continue'))

    expect(mockNavigate.mock.calls[0][1]).toEqual({ state: { from: expect.any(String) } })
  })

  it.each([
    {
      entryPoint: '/explore/hooks/ethereum/0x1111111111111111111111111111111111111111',
      expected: '/explore/hooks/ethereum/0x1111111111111111111111111111111111111111',
    },
    { entryPoint: '/explore/pools', expected: null },
    { entryPoint: '//example.com/hooks', expected: null },
    { entryPoint: '', expected: null },
  ])('preserves only a hook detail entry point into the existing pool: $entryPoint', ({ entryPoint, expected }) => {
    vi.mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.HooksExplore)
    const search = `?${new URLSearchParams({ entryPoint, unrelated: 'drop' })}`
    window.history.replaceState({}, '', `/positions/add/new${search}`)
    const { setPositionState } = mockCreateLiquidityContext(EXISTING_POOL, {
      protocolVersion: ProtocolVersion.V4,
      hook: HOOK,
    })
    renderStep()

    fireEvent.click(screen.getByText('Continue'))

    expect(mockNavigate).toHaveBeenCalledOnce()
    const target = new URL(mockNavigate.mock.calls[0][0] as string, 'https://app.uniswap.org')
    expect(target.pathname).toBe('/positions/add/ethereum/pool-id')
    expect(target.searchParams.get('hook')).toBe(HOOK)
    expect(target.searchParams.get('protocolVersion')).toBe('v4')
    expect(target.searchParams.get('entryPoint')).toBe(expected)
    expect(target.searchParams.has('source')).toBe(false)
    expect(target.searchParams.has('unrelated')).toBe(false)
    expect(target.searchParams.has('step')).toBe(false)
    expect(mockNavigate.mock.calls[0][1]).toEqual({ state: { from: `/positions/add/new${search}` } })
    expect(setPositionState).not.toHaveBeenCalled()
  })

  // A v2 migration has no `migratingPosition` (that's v3-only), so the existing-pool hop must key off
  // the migration itself — otherwise the user lands on the add-liquidity deposit form.
  it('advances the migration form instead of navigating when the target pool exists', () => {
    const onContinue = vi.fn()
    render(
      <SelectTokensStep
        isMigration
        currencyInputs={CURRENCY_INPUTS}
        setCurrencyInputs={vi.fn()}
        onContinue={onContinue}
      />,
    )

    fireEvent.click(screen.getByText('Continue'))

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('keeps the existing-pool URL unchanged when Hooks Explore is disabled', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    const entryPoint = '/explore/hooks/ethereum/0x1111111111111111111111111111111111111111'
    window.history.replaceState({}, '', `/positions/add/new?${new URLSearchParams({ entryPoint })}`)
    mockCreateLiquidityContext(EXISTING_POOL, { protocolVersion: ProtocolVersion.V4, hook: HOOK })
    renderStep()

    fireEvent.click(screen.getByText('Continue'))

    const target = new URL(mockNavigate.mock.calls[0][0] as string, 'https://app.uniswap.org')
    expect(target.pathname).toBe('/positions/add/ethereum/pool-id')
    expect(target.searchParams.has('entryPoint')).toBe(false)
    expect(target.searchParams.has('source')).toBe(false)
  })
})

describe('SelectTokensStep hook-detail consent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState(
      {},
      '',
      `/positions/add/new?hook=${HOOK}&protocolVersion=v4&entryPoint=%2Fexplore%2Fhooks%2Fethereum%2F0x1111111111111111111111111111111111111111`,
    )
    mockGeoRestriction({})
    mockedUseBlockedTokens.mockReturnValue({ hasBlockedToken: false, blockedTokenSymbols: [] })
  })

  it('opens and reopens the review without approval, and approves only on the modal Continue', () => {
    const { positionState, setPositionState } = mockCreateLiquidityContext(NEW_POOL, {
      protocolVersion: ProtocolVersion.V4,
      hook: HOOK,
    })
    const { onContinue } = renderStep()
    expect(screen.queryByRole('dialog', { name: 'Review hook' })).not.toBeInTheDocument()
    expect(setPositionState).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Continue'))

    expect(screen.getByRole('dialog', { name: 'Review hook' })).toBeInTheDocument()
    expect(onContinue).not.toHaveBeenCalled()
    expect(setPositionState).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss hook review' }))
    expect(screen.queryByRole('dialog', { name: 'Review hook' })).not.toBeInTheDocument()
    expect(setPositionState).not.toHaveBeenCalled()
    expect(onContinue).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Continue'))
    expect(screen.getByRole('dialog', { name: 'Review hook' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continue with hook' }))

    expect(setPositionState).toHaveBeenCalledOnce()
    const update = vi.mocked(setPositionState).mock.lastCall?.[0]
    if (typeof update !== 'function') {
      throw new Error('Expected the modal to update position state')
    }
    expect(update(positionState)).toEqual({ ...positionState, userApprovedHook: HOOK })
    expect(onContinue).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog', { name: 'Review hook' })).not.toBeInTheDocument()
  })

  it('removes the hook and fee without approval when the user declines the modal', () => {
    const { positionState, setPositionState } = mockCreateLiquidityContext(NEW_POOL, {
      protocolVersion: ProtocolVersion.V4,
      hook: HOOK,
    })
    const { onContinue } = renderStep()
    fireEvent.click(screen.getByText('Continue'))
    fireEvent.click(screen.getByRole('button', { name: 'Remove hook' }))

    expect(setPositionState).toHaveBeenCalledOnce()
    const update = vi.mocked(setPositionState).mock.lastCall?.[0]
    if (typeof update !== 'function') {
      throw new Error('Expected declining the hook to update position state')
    }
    expect(update(positionState)).toEqual({ ...positionState, hook: undefined, fee: undefined })
    expect(onContinue).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog', { name: 'Review hook' })).not.toBeInTheDocument()
  })
})
