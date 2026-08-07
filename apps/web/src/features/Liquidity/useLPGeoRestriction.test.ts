import { RestrictionReason } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'
import type { Currency } from '@uniswap/sdk-core'
import { useIsFeatureGated, useTokenComplianceStatus } from '@universe/compliance'
import { useIsRWAToken } from 'uniswap/src/features/rwa/useIsRWAToken'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { renderHook } from '~/test-utils/render'

// Only the data sources are mocked. The classification (`isHardBlocked`/`isAckGated`/
// `hasUnrecognizedReason`) and `useCurrencyGeoRestrictionMode`'s RWA AND stay real, so these tests
// exercise the actual decision rather than a restated copy of it.
vi.mock('@universe/compliance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/compliance')>()),
  useTokenComplianceStatus: vi.fn(),
  useIsFeatureGated: vi.fn(),
}))

vi.mock('uniswap/src/features/rwa/useIsRWAToken', () => ({
  useIsRWAToken: vi.fn<(currency: Maybe<Currency>, options?: { enabled?: boolean }) => boolean>(),
}))

const mockedUseTokenComplianceStatus = vi.mocked(useTokenComplianceStatus)
const mockedUseIsFeatureGated = vi.mocked(useIsFeatureGated)
const mockedUseIsRWAToken = vi.mocked(useIsRWAToken)

const AAPLX = { symbol: 'AAPLX', chainId: 1, address: '0xaaplx', isNative: false } as Currency
const USDC = { symbol: 'USDC', chainId: 1, address: '0xusdc', isNative: false } as Currency
const NO_SYMBOL = { chainId: 1, address: '0xnosymbol', isNative: false } as Currency

/** Per-token compliance reasons, keyed by the lowercased address `toComplianceTokenRef` produces. */
function setTokenReasons(byAddress: Record<string, { reasons?: RestrictionReason[]; isLoading?: boolean }>): void {
  mockedUseTokenComplianceStatus.mockImplementation((token) => {
    const entry = token ? byAddress[token.address] : undefined
    // An unresolved or unreadable lookup reports no reasons — the deny-list cannot distinguish those
    // from a clean token, which is what makes both windows fail open.
    return {
      reasons: entry?.reasons ?? [],
      isLoading: entry?.isLoading ?? false,
    }
  })
}

/**
 * Which currencies the `ListRwas` registry matches. An unresolved lookup reports `false` — the
 * registry cannot distinguish "not an RWA" from "not answered yet", which is what makes the loading
 * window fail open.
 */
function setRWARegistry(bySymbol: Record<string, { isRWA?: boolean }>): void {
  mockedUseIsRWAToken.mockImplementation((currency, options) => {
    const enabled = options?.enabled ?? true
    const entry = currency?.symbol ? bySymbol[currency.symbol] : undefined
    return enabled && Boolean(entry?.isRWA)
  })
}

describe('useLPGeoRestriction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: region is gated for RWAs, nothing is an RWA, no token carries a reason, all resolved.
    mockedUseIsFeatureGated.mockReturnValue(true)
    setTokenReasons({})
    setRWARegistry({})
  })

  describe('restricted -> blocked', () => {
    it('blocks when the region is gated for RWAs and token0 is an RWA', () => {
      setRWARegistry({ AAPLX: { isRWA: true } })
      const { result } = renderHook(() => useLPGeoRestriction({ token0: AAPLX, token1: USDC }))

      expect(result.current.isGeoRestricted).toBe(true)
      expect(result.current.restrictedTokenSymbol).toBe('AAPLX')
      expect(result.current.unavailableLabel).toBe('AAPLX unavailable in your region')
    })

    it('blocks on the token1 side and names that token in the label', () => {
      setRWARegistry({ AAPLX: { isRWA: true } })
      const { result } = renderHook(() => useLPGeoRestriction({ token0: USDC, token1: AAPLX }))

      expect(result.current.isGeoRestricted).toBe(true)
      expect(result.current.restrictedTokenSymbol).toBe('AAPLX')
    })

    it('blocks a hard-blocked token regardless of the RWA registry', () => {
      mockedUseIsFeatureGated.mockReturnValue(false)
      setTokenReasons({ '0xaaplx': { reasons: [RestrictionReason.DERIVATIVE] } })
      const { result } = renderHook(() => useLPGeoRestriction({ token0: AAPLX, token1: USDC }))

      expect(result.current.isGeoRestricted).toBe(true)
      expect(result.current.restrictedTokenSymbol).toBe('AAPLX')
    })

    // The product decision this gate turns on: swap lets an ack-gated token through after a
    // recorded attestation, LP does not, because LP is supply-side.
    it('blocks an acknowledgement-gated token with no attestation bypass', () => {
      mockedUseIsFeatureGated.mockReturnValue(false)
      setTokenReasons({ '0xaaplx': { reasons: [RestrictionReason.REQUIRES_ACKNOWLEDGEMENT] } })
      const { result } = renderHook(() => useLPGeoRestriction({ token0: AAPLX, token1: USDC }))

      expect(result.current.isGeoRestricted).toBe(true)
    })

    it('blocks an already-acknowledged token too, since the attestation buys nothing here', () => {
      mockedUseIsFeatureGated.mockReturnValue(false)
      setTokenReasons({ '0xaaplx': { reasons: [RestrictionReason.ACKNOWLEDGED] } })
      const { result } = renderHook(() => useLPGeoRestriction({ token0: AAPLX, token1: USDC }))

      expect(result.current.isGeoRestricted).toBe(true)
    })

    it('blocks on a RestrictionReason the client does not model yet (fail safe)', () => {
      mockedUseIsFeatureGated.mockReturnValue(false)
      setTokenReasons({ '0xaaplx': { reasons: [12345 as RestrictionReason] } })
      const { result } = renderHook(() => useLPGeoRestriction({ token0: AAPLX, token1: USDC }))

      expect(result.current.isGeoRestricted).toBe(true)
    })

    it('falls back to the generic label when the restricted token has no symbol', () => {
      setRWARegistry({})
      setTokenReasons({ '0xnosymbol': { reasons: [RestrictionReason.DERIVATIVE] } })
      const { result } = renderHook(() => useLPGeoRestriction({ token0: NO_SYMBOL, token1: USDC }))

      expect(result.current.isGeoRestricted).toBe(true)
      expect(result.current.unavailableLabel).toBe('Not available in your region')
    })
  })

  // LP matches swap: an unanswered check reads as `'default'`, so the CTA stays live during the
  // window rather than being held disabled. The block still lands the moment the answer arrives, and
  // the signing surface (`ReviewModal`, `IncreaseLiquidityReview`) re-reads this hook, so a
  // restriction arriving after Continue was pressed is still caught there.
  describe('in flight -> allowed (fail open)', () => {
    it("does not restrict while a token's compliance reasons are still loading", () => {
      setTokenReasons({ '0xusdc': { isLoading: true } })
      const { result } = renderHook(() => useLPGeoRestriction({ token0: AAPLX, token1: USDC }))

      expect(result.current.isGeoRestricted).toBe(false)
    })

    it('does not restrict while the RWA registry lookup is unresolved in a gated region', () => {
      setRWARegistry({})
      const { result } = renderHook(() => useLPGeoRestriction({ token0: AAPLX, token1: USDC }))

      expect(result.current.isGeoRestricted).toBe(false)
    })

    // The block is not lost, only deferred: the same pair restricts as soon as the registry answers.
    it('restricts the same pair once the registry resolves it as an RWA', () => {
      setRWARegistry({ AAPLX: { isRWA: true } })
      const { result } = renderHook(() => useLPGeoRestriction({ token0: AAPLX, token1: USDC }))

      expect(result.current.isGeoRestricted).toBe(true)
      expect(result.current.restrictedTokenSymbol).toBe('AAPLX')
    })

    // A reason that HAS arrived still blocks even though the other side is mid-flight, so failing
    // open on loading never suppresses a restriction that is already known.
    it('still blocks a token whose reason arrived while the other side is loading', () => {
      setTokenReasons({
        '0xaaplx': { reasons: [RestrictionReason.DERIVATIVE] },
        '0xusdc': { isLoading: true },
      })
      const { result } = renderHook(() => useLPGeoRestriction({ token0: AAPLX, token1: USDC }))

      expect(result.current.isGeoRestricted).toBe(true)
      expect(result.current.restrictedTokenSymbol).toBe('AAPLX')
    })
  })

  describe('unrestricted -> allowed', () => {
    it('allows a clean pair once every check has resolved', () => {
      const { result } = renderHook(() => useLPGeoRestriction({ token0: USDC, token1: AAPLX }))

      expect(result.current.isGeoRestricted).toBe(false)
      expect(result.current.restrictedTokenSymbol).toBeUndefined()
    })

    // Guards the region-only nature of the feature check: gating on it alone would block every
    // token for everyone in a gated region.
    it('allows a non-RWA token even though the region is gated for RWAs', () => {
      mockedUseIsFeatureGated.mockReturnValue(true)
      setRWARegistry({ AAPLX: { isRWA: true } })
      const { result } = renderHook(() => useLPGeoRestriction({ token0: USDC, token1: USDC }))

      expect(result.current.isGeoRestricted).toBe(false)
    })

    it('allows an RWA when the region is not gated for RWAs', () => {
      mockedUseIsFeatureGated.mockReturnValue(false)
      setRWARegistry({ AAPLX: { isRWA: true } })
      const { result } = renderHook(() => useLPGeoRestriction({ token0: AAPLX, token1: USDC }))

      expect(result.current.isGeoRestricted).toBe(false)
    })

    it('does not restrict before either side of the pair is picked', () => {
      const { result } = renderHook(() => useLPGeoRestriction({ token0: undefined, token1: undefined }))

      expect(result.current.isGeoRestricted).toBe(false)
      expect(result.current.restrictedTokenSymbol).toBeUndefined()
    })

    it('still evaluates a single-sided selection', () => {
      setRWARegistry({ AAPLX: { isRWA: true } })
      const { result } = renderHook(() => useLPGeoRestriction({ token0: AAPLX, token1: undefined }))

      expect(result.current.isGeoRestricted).toBe(true)
      expect(result.current.restrictedTokenSymbol).toBe('AAPLX')
    })
  })
})
