import type { Currency } from '@uniswap/sdk-core'
import { hasUnrecognizedReason, isAckGated, isHardBlocked, useTokenComplianceStatus } from '@universe/compliance'
import { useToucanGeoRestriction } from '~/components/GeoRestriction/useToucanGeoRestriction'
import { renderHook } from '~/test-utils/render'

vi.mock('@universe/compliance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/compliance')>()),
  useTokenComplianceStatus: vi.fn(),
  isHardBlocked: vi.fn(),
  isAckGated: vi.fn(),
  hasUnrecognizedReason: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode', () => ({
  toComplianceTokenRef: vi.fn((currency) => (currency ? { chainId: 1, address: '0xabc' } : undefined)),
}))

const mockedUseTokenComplianceStatus = vi.mocked(useTokenComplianceStatus)
const mockedIsHardBlocked = vi.mocked(isHardBlocked)
const mockedIsAckGated = vi.mocked(isAckGated)
const mockedHasUnrecognizedReason = vi.mocked(hasUnrecognizedReason)
const KALSHI = { symbol: 'KALSHI' } as Currency

describe('useToucanGeoRestriction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseTokenComplianceStatus.mockReturnValue({ reasons: [], isLoading: false })
    mockedIsHardBlocked.mockReturnValue(false)
    mockedIsAckGated.mockReturnValue(false)
    mockedHasUnrecognizedReason.mockReturnValue(false)
  })

  it('blocks hard-blocked tokens and labels the CTA', () => {
    mockedIsHardBlocked.mockReturnValue(true)
    const { result } = renderHook(() => useToucanGeoRestriction(KALSHI))
    expect(result.current.isGeoRestricted).toBe(true)
    expect(result.current.unavailableLabel).toBe('KALSHI is unavailable in your region')
  })

  it('blocks acknowledgement-gated tokens (no bypass on the supply side)', () => {
    mockedIsAckGated.mockReturnValue(true)
    const { result } = renderHook(() => useToucanGeoRestriction(KALSHI))
    expect(result.current.isGeoRestricted).toBe(true)
  })

  it('treats an unrecognized reason as restricted (fail-safe)', () => {
    mockedHasUnrecognizedReason.mockReturnValue(true)
    const { result } = renderHook(() => useToucanGeoRestriction(KALSHI))
    expect(result.current.isGeoRestricted).toBe(true)
  })

  it('allows a clean token', () => {
    const { result } = renderHook(() => useToucanGeoRestriction(KALSHI))
    expect(result.current.isGeoRestricted).toBe(false)
  })

  it('uses the generic label when the currency has no symbol', () => {
    const { result } = renderHook(() => useToucanGeoRestriction(undefined))
    expect(result.current.unavailableLabel).toBe('This token is unavailable in your region')
  })

  it('is pending (but not restricted) while the compliance status is loading for a selected token', () => {
    mockedUseTokenComplianceStatus.mockReturnValue({ reasons: [], isLoading: true })
    const { result } = renderHook(() => useToucanGeoRestriction(KALSHI))
    expect(result.current.isGeoRestrictionPending).toBe(true)
    expect(result.current.isGeoRestricted).toBe(false)
  })

  it('is not pending once the compliance status resolves', () => {
    mockedUseTokenComplianceStatus.mockReturnValue({ reasons: [], isLoading: false })
    const { result } = renderHook(() => useToucanGeoRestriction(KALSHI))
    expect(result.current.isGeoRestrictionPending).toBe(false)
  })

  it('is not pending when no currency is selected', () => {
    mockedUseTokenComplianceStatus.mockReturnValue({ reasons: [], isLoading: true })
    const { result } = renderHook(() => useToucanGeoRestriction(undefined))
    expect(result.current.isGeoRestrictionPending).toBe(false)
  })
})
