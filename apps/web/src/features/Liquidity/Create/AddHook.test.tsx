import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { SetStateAction } from 'react'
import type { Mock } from 'vitest'
import { AddHook } from '~/features/Liquidity/Create/AddHook'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { useLiquidityUrlState } from '~/features/Liquidity/Create/hooks/useLiquidityUrlState'
import { DEFAULT_POSITION_STATE, type PositionState } from '~/features/Liquidity/Create/types'
import { render } from '~/test-utils/render'

vi.mock('~/features/Liquidity/Create/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))
vi.mock('~/features/Liquidity/Create/hooks/useLiquidityUrlState', () => ({ useLiquidityUrlState: vi.fn() }))
vi.mock('uniswap/src/features/poolHooks/hooks/useHookRegistryMap', () => ({
  getHookRegistryKey: () => 'key',
  useHookRegistryMap: () => undefined,
}))
vi.mock('uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance', () => ({
  useUniswapHookProvenance: () => () => undefined,
}))

const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)
const mockedUseLiquidityUrlState = vi.mocked(useLiquidityUrlState)

// The WETHHook on OP Mainnet: the hook registry serves it lowercase, the `?hook=` parser checksums it.
const REGISTRY_HOOK = '0x480dafdb4d6092ef3217595b75784ec54b52e888'
const URL_HOOK = '0x480DaFDB4D6092ef3217595b75784ec54B52E888'
const OTHER_HOOK = '0x0000000000000000000000000000000000000Abc'

/** Mounts AddHook over `state` and returns what its URL-seed effect left position state as, plus the setter. */
function renderAndApplySeed({ state, urlHook }: { state: PositionState; urlHook: string }): {
  next: PositionState
  setPositionState: Mock
  rerender: ReturnType<typeof render>['rerender']
} {
  let next = state
  const setPositionState = vi.fn((action: SetStateAction<PositionState>) => {
    next = typeof action === 'function' ? action(next) : action
  })
  mockedUseLiquidityUrlState.mockReturnValue({ hook: urlHook } as unknown as ReturnType<typeof useLiquidityUrlState>)
  mockedUseCreateLiquidityContext.mockReturnValue({
    positionState: state,
    currencies: { display: { TOKEN0: { chainId: 10 }, TOKEN1: { chainId: 10 } } },
    setPositionState,
    setHookSearchModalOpen: vi.fn(),
    selectedHookEntry: undefined,
    setSelectedHookEntry: vi.fn(),
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)

  const { rerender } = render(<AddHook />)
  return { next, setPositionState, rerender }
}

describe('AddHook URL seed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Edit on the range step remounts AddHook with a registry-picked (lowercase) hook in state and the
  // checksummed spelling in the URL. Writing a new state object there is what crashed the page.
  it('keeps the same state object when the URL hook differs from state only by casing', () => {
    const state: PositionState = {
      ...DEFAULT_POSITION_STATE,
      protocolVersion: ProtocolVersion.V4,
      hook: REGISTRY_HOOK,
      userApprovedHook: REGISTRY_HOOK,
    }

    expect(renderAndApplySeed({ state, urlHook: URL_HOOK }).next).toBe(state)
  })

  it('seeds the URL hook when state holds no hook', () => {
    const state: PositionState = { ...DEFAULT_POSITION_STATE, protocolVersion: ProtocolVersion.V4, hook: undefined }

    expect(renderAndApplySeed({ state, urlHook: URL_HOOK }).next.hook).toBe(URL_HOOK)
  })

  it('replaces a different hook with the URL hook', () => {
    const state: PositionState = { ...DEFAULT_POSITION_STATE, protocolVersion: ProtocolVersion.V4, hook: OTHER_HOOK }

    expect(renderAndApplySeed({ state, urlHook: URL_HOOK }).next.hook).toBe(URL_HOOK)
  })

  // The current hook stays out of the effect deps: a clear while mounted (state hook gone, URL not yet
  // synced) must not re-seed the stale URL hook.
  it('does not re-seed when the hook is cleared while mounted', () => {
    const state: PositionState = { ...DEFAULT_POSITION_STATE, protocolVersion: ProtocolVersion.V4, hook: URL_HOOK }
    const { setPositionState, rerender } = renderAndApplySeed({ state, urlHook: URL_HOOK })
    const callsAfterMount = setPositionState.mock.calls.length

    mockedUseCreateLiquidityContext.mockReturnValue({
      ...mockedUseCreateLiquidityContext.mock.results[0]?.value,
      positionState: { ...state, hook: undefined },
    })
    rerender(<AddHook />)

    expect(setPositionState).toHaveBeenCalledTimes(callsAfterMount)
  })

  it('does not seed outside v4', () => {
    const state: PositionState = { ...DEFAULT_POSITION_STATE, protocolVersion: ProtocolVersion.V3, hook: undefined }

    const { setPositionState } = renderAndApplySeed({ state, urlHook: URL_HOOK })
    expect(setPositionState).not.toHaveBeenCalled()
  })
})
