import type { Currency } from '@uniswap/sdk-core'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useMigrateGeoGate } from '~/pages/Migrate/useMigrateGeoGate'
import { renderHook } from '~/test-utils/render'

vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({
  useLPGeoRestriction: vi.fn(),
}))

const mockedUseLPGeoRestriction = vi.mocked(useLPGeoRestriction)
const AAPLX = { symbol: 'AAPLX', chainId: 1, address: '0xaaplx', isNative: false } as Currency
const USDC = { symbol: 'USDC', chainId: 1, address: '0xusdc', isNative: false } as Currency

function mockGeoRestriction(overrides: Partial<ReturnType<typeof useLPGeoRestriction>>): void {
  mockedUseLPGeoRestriction.mockReturnValue({
    isGeoRestricted: false,
    restrictedTokenSymbol: undefined,
    unavailableLabel: 'Not available in your region',
    ...overrides,
  })
}

describe('useMigrateGeoGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes the pair through to the shared LP geo check', () => {
    mockGeoRestriction({})
    renderHook(() => useMigrateGeoGate({ token0: AAPLX, token1: USDC }))

    expect(mockedUseLPGeoRestriction).toHaveBeenCalledWith({ token0: AAPLX, token1: USDC })
  })

  it('blocks Continue and surfaces the banner props when the pair is restricted', () => {
    mockGeoRestriction({
      isGeoRestricted: true,
      restrictedTokenSymbol: 'AAPLX',
      unavailableLabel: 'AAPLX unavailable in your region',
    })
    const { result } = renderHook(() => useMigrateGeoGate({ token0: AAPLX, token1: USDC }))

    expect(result.current.disableContinue).toBe(true)
    expect(result.current.geoRestriction).toEqual({
      tokenSymbol: 'AAPLX',
      unavailableLabel: 'AAPLX unavailable in your region',
    })
  })

  // Fail open, matching swap: `isGeoRestricted: false` is also what an unresolved check reports, so
  // this one case covers both "confirmed clean" and "still in flight" — the gate has no third state.
  it('allows Continue and shows no banner when the pair is not restricted', () => {
    mockGeoRestriction({ isGeoRestricted: false })
    const { result } = renderHook(() => useMigrateGeoGate({ token0: USDC, token1: USDC }))

    expect(result.current.disableContinue).toBe(false)
    expect(result.current.geoRestriction).toBeUndefined()
  })

  it('carries the generic label through when the restricted token has no symbol', () => {
    mockGeoRestriction({
      isGeoRestricted: true,
      restrictedTokenSymbol: undefined,
      unavailableLabel: 'Not available in your region',
    })
    const { result } = renderHook(() => useMigrateGeoGate({ token0: AAPLX, token1: USDC }))

    expect(result.current.geoRestriction).toEqual({
      tokenSymbol: undefined,
      unavailableLabel: 'Not available in your region',
    })
  })
})
