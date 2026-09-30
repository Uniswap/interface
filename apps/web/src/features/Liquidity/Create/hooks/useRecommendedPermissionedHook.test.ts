import { renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolsOrderBy, PoolTokenLogicalOperator } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import {
  useRecommendedHookPrefill,
  useRecommendedPermissionedHook,
} from '~/features/Liquidity/Create/hooks/useRecommendedPermissionedHook'
import type { PositionState } from '~/features/Liquidity/Create/types'

// Real EIP-55 checksum (computed via viem getAddress); the mocked map stores it lowercase.
const SDK_FALLBACK_HOOK = vi.hoisted(() => '0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD')

const { mockUseActiveAddress, mockUsePermissionedSwapPair, mockUseInfiniteQuery } = vi.hoisted(() => ({
  mockUseActiveAddress: vi.fn(),
  mockUsePermissionedSwapPair: vi.fn(),
  mockUseInfiniteQuery: vi.fn(),
}))

// Pin the sdk map to known values so the tests don't depend on which chains the real package
// ships the field for: Sepolia gets a sentinel hook address to exercise the fallback.
vi.mock('@uniswap/sdk-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uniswap/sdk-core')>()
  return {
    ...actual,
    CHAIN_TO_ADDRESSES_MAP: {
      ...actual.CHAIN_TO_ADDRESSES_MAP,
      [11155111]: {
        ...(actual.CHAIN_TO_ADDRESSES_MAP as Record<number, object | undefined>)[11155111],
        permissionedV4HooksAddress: SDK_FALLBACK_HOOK.toLowerCase(),
      },
      // Explicitly stripped so the "chain whose entry lacks the hooks address" case stays
      // deterministic no matter which chains sdk-core ships the field for.
      [1]: {
        ...(actual.CHAIN_TO_ADDRESSES_MAP as Record<number, object | undefined>)[1],
        permissionedV4HooksAddress: undefined,
      },
    },
  }
})

vi.mock('~/features/accounts/store/hooks', () => ({
  useActiveAddress: mockUseActiveAddress,
}))

vi.mock('uniswap/src/features/permissionedTokens/usePermissionedSwapPair', () => ({
  usePermissionedSwapPair: mockUsePermissionedSwapPair,
}))

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useInfiniteQuery: mockUseInfiniteQuery,
}))

// Pass the input through so tests can assert on the params/enabled the hook builds.
vi.mock('uniswap/src/data/apiClients/dataApiService/pools/queries', () => ({
  getListPoolsInfiniteQueryOptions: (input: unknown): unknown => input,
}))

const SEPOLIA = 11155111

// Underlying sec-token the user selects; the pool holds the adapter instead.
const UNDERLYING = '0xBf56488c857a881AE7e3bED27CF99C10a7ab7E50'
const ADAPTER = '0xeF1dC9ABD8A7E073CFDDA453C775e7cE24e4A4C8'
const WETH = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'
// Checksummed forms of the discovered hooks (real EIP-55, computed via viem getAddress).
const HOOK_A = '0xEADe493b075Cee00e6A832Af758B7c76793FE880'
const HOOK_B = '0x8B0E8d467af81D9F5B49165e104a2fe1b98328C0'
const ZERO = '0x0000000000000000000000000000000000000000'
const WALLET = '0xaaaaBBBBccccDDDDeeeeFFFF000011112222Aaaa'

const erc20 = (address: string, chainId = SEPOLIA, symbol = 'PTOK1'): Currency =>
  ({ chainId, isNative: false, isToken: true, address, symbol }) as unknown as Currency

const permissionedPair = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  isPermissioned: true,
  isAllowlisted: true,
  isLoading: false,
  permissionedSide: 'input',
  inputAdapterAddress: ADAPTER,
  outputAdapterAddress: undefined,
  ...overrides,
})

// data.v2 ListPools RankedPool fixture — the only pool source. `liquidity` (an integer string) is
// optional so the TVL-tie tests can exercise both the raw-liquidity tiebreak and the list-order
// fall-through (an unset liquidity normalizes to 0n).
const rankedPool = ({
  hook,
  tvl,
  liquidity,
  chainId = SEPOLIA,
  token0 = ADAPTER,
  token1 = WETH,
  poolId = '0xpool',
}: {
  hook: string | undefined
  tvl: number
  liquidity?: string
  chainId?: number
  token0?: string
  token1?: string
  poolId?: string
}): Record<string, unknown> => ({
  pool: {
    poolId,
    chainId,
    protocolVersion: ProtocolVersion.V4,
    token0: { address: token0, chainId },
    token1: { address: token1, chainId },
    feeTier: 3000,
    isDynamicFee: false,
    hookAddress: hook,
    liquidity,
  },
  stats: { tvl },
})

const listPools = (pools: Record<string, unknown>[]) => ({ data: { pages: [{ pools }] }, isLoading: false })

beforeEach(() => {
  vi.clearAllMocks()
  mockUseActiveAddress.mockReturnValue(WALLET)
  mockUseInfiniteQuery.mockReturnValue({ data: undefined, isLoading: false })
})

describe('useRecommendedPermissionedHook', () => {
  it('queries data.v2 ListPools by the sorted adapter-mapped pair, not the displayed sec-token', () => {
    mockUsePermissionedSwapPair.mockReturnValue(permissionedPair())

    renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(UNDERLYING), tokenB: erc20(WETH, SEPOLIA, 'WETH') }),
    )

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith({
      params: {
        chainIds: [SEPOLIA],
        sort: { orderBy: PoolsOrderBy.TVL },
        filter: {
          protocolVersions: [ProtocolVersion.V4],
          // Server-side v4 filter; checksummed pair set (the hook sorts lowercased, the filter re-checksums).
          tokenFilter: { tokens: [ADAPTER, WETH], logicalOperator: PoolTokenLogicalOperator.AND },
          includeSpam: true,
          applyTopLevelFilters: false,
        },
      },
      pageSize: 100,
      enabled: true,
      persist: false,
    })
  })

  it('sorts the pair when the adapter-mapped addresses arrive out of order', () => {
    mockUsePermissionedSwapPair.mockReturnValue(
      permissionedPair({ inputAdapterAddress: undefined, outputAdapterAddress: ADAPTER, permissionedSide: 'output' }),
    )

    // tokenA = WETH (0xfff9... sorts AFTER the adapter 0xef1d...), tokenB = permissioned.
    renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(WETH, SEPOLIA, 'WETH'), tokenB: erc20(UNDERLYING) }),
    )

    const input = mockUseInfiniteQuery.mock.calls.at(-1)?.[0] as {
      params: { filter: { tokenFilter: { tokens: string[] } } }
    }
    expect(input.params.filter.tokenFilter.tokens).toEqual([ADAPTER, WETH])
  })

  it('returns the deepest hooked pool, skipping zero-address hooks, checksummed', () => {
    mockUsePermissionedSwapPair.mockReturnValue(permissionedPair())
    mockUseInfiniteQuery.mockReturnValue(
      listPools([
        rankedPool({ hook: ZERO, tvl: 999999 }),
        rankedPool({ hook: HOOK_A.toLowerCase(), tvl: 10 }),
        rankedPool({ hook: HOOK_B.toLowerCase(), tvl: 20 }),
      ]),
    )

    const { result } = renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(UNDERLYING), tokenB: erc20(WETH, SEPOLIA, 'WETH') }),
    )

    expect(result.current.recommendedHook).toBe(HOOK_B)
  })

  it('breaks TVL ties on raw liquidity', () => {
    mockUsePermissionedSwapPair.mockReturnValue(permissionedPair())
    mockUseInfiniteQuery.mockReturnValue(
      listPools([
        rankedPool({ hook: HOOK_A.toLowerCase(), tvl: 0, liquidity: '200' }),
        rankedPool({ hook: HOOK_B.toLowerCase(), tvl: 0, liquidity: '100' }),
      ]),
    )

    const { result } = renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(UNDERLYING), tokenB: erc20(WETH, SEPOLIA, 'WETH') }),
    )

    expect(result.current.recommendedHook).toBe(HOOK_A)
  })

  it('breaks TVL ties by server list order when liquidity is unset on the v2 response', () => {
    mockUsePermissionedSwapPair.mockReturnValue(permissionedPair())
    mockUseInfiniteQuery.mockReturnValue(
      listPools([
        rankedPool({ hook: HOOK_A.toLowerCase(), tvl: 0 }),
        rankedPool({ hook: HOOK_B.toLowerCase(), tvl: 0 }),
      ]),
    )

    const { result } = renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(UNDERLYING), tokenB: erc20(WETH, SEPOLIA, 'WETH') }),
    )

    // Neither pool carries `liquidity`, so both normalize to `liquidity: 0n`; the reduce's
    // `a.liquidity >= b.liquidity` tiebreak falls through to whichever pool the server listed first.
    expect(result.current.recommendedHook).toBe(HOOK_A)
  })

  it('excludes a pool for an unrelated pair even if the server tokenFilter should have removed it', () => {
    mockUsePermissionedSwapPair.mockReturnValue(permissionedPair())
    mockUseInfiniteQuery.mockReturnValue(
      listPools([
        // Unrelated pair — a server-side tokenFilter bug must not let this win the recommendation.
        rankedPool({ hook: HOOK_A, tvl: 999999999, token0: HOOK_A, token1: HOOK_B, poolId: '0xwrongpair' }),
        rankedPool({ hook: HOOK_B.toLowerCase(), tvl: 10 }),
      ]),
    )

    const { result } = renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(UNDERLYING), tokenB: erc20(WETH, SEPOLIA, 'WETH') }),
    )

    // wrongPairPool's TVL dwarfs the correctly-paired pool's, so this only passes if the pair
    // re-check excludes it rather than trusting the server's tokenFilter.
    expect(result.current.recommendedHook).toBe(HOOK_B)
  })

  it('excludes a same-address pool on a different chain even if the server tokenFilter should have removed it', () => {
    mockUsePermissionedSwapPair.mockReturnValue(permissionedPair())
    mockUseInfiniteQuery.mockReturnValue(
      listPools([
        // Same pair addresses as the target pair, but on a different chain.
        rankedPool({ hook: HOOK_A, tvl: 999999999, chainId: 1, poolId: '0xwrongchain' }),
        rankedPool({ hook: HOOK_B.toLowerCase(), tvl: 10 }),
      ]),
    )

    const { result } = renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(UNDERLYING, SEPOLIA), tokenB: erc20(WETH, SEPOLIA, 'WETH') }),
    )

    // wrongChainPool's TVL dwarfs the correctly-paired pool's, so this only passes if the chain
    // re-check excludes it rather than trusting the server's tokenFilter/chainIds param.
    expect(result.current.recommendedHook).toBe(HOOK_B)
  })

  it('disables the pool query and returns undefined when the pair is not permissioned', () => {
    mockUsePermissionedSwapPair.mockReturnValue(
      permissionedPair({ isPermissioned: false, inputAdapterAddress: undefined, permissionedSide: undefined }),
    )

    const { result } = renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(UNDERLYING), tokenB: erc20(WETH, SEPOLIA, 'WETH') }),
    )

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    expect(result.current.recommendedHook).toBeUndefined()
  })

  it('disables the pool query for a cross-chain pair', () => {
    mockUsePermissionedSwapPair.mockReturnValue(permissionedPair())

    renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(UNDERLYING, SEPOLIA), tokenB: erc20(WETH, 1, 'WETH') }),
    )

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  describe('sdk fallback', () => {
    beforeEach(() => {
      mockUsePermissionedSwapPair.mockReturnValue(permissionedPair())
    })

    const render = ({ chainId = SEPOLIA }: { chainId?: number } = {}) =>
      renderHook(() =>
        useRecommendedPermissionedHook({
          tokenA: erc20(UNDERLYING, chainId),
          tokenB: erc20(WETH, chainId, 'WETH'),
        }),
      )

    it('falls back to the canonical sdk hook, checksummed, when discovery settles with no hooked pools', () => {
      // Pool exists but is hookless, so discovery legitimately finds nothing.
      mockUseInfiniteQuery.mockReturnValue(listPools([rankedPool({ hook: ZERO, tvl: 100, liquidity: '100' })]))

      const { result } = render()

      expect(result.current.recommendedHook).toBe(SDK_FALLBACK_HOOK)
    })

    it('falls back when the query settles with zero pools (first-ever pair)', () => {
      mockUseInfiniteQuery.mockReturnValue(listPools([]))

      const { result } = render()

      expect(result.current.recommendedHook).toBe(SDK_FALLBACK_HOOK)
    })

    it('falls back on query error (settled-empty semantics)', () => {
      mockUseInfiniteQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true })

      const { result } = render()

      expect(result.current.recommendedHook).toBe(SDK_FALLBACK_HOOK)
    })

    it('prefers the discovered hook over the sdk fallback when a hooked pool exists', () => {
      mockUseInfiniteQuery.mockReturnValue(
        listPools([rankedPool({ hook: HOOK_A.toLowerCase(), tvl: 10, liquidity: '100' })]),
      )

      const { result } = render()

      expect(result.current.recommendedHook).toBe(HOOK_A)
    })

    it('never falls back for a non-permissioned pair, even settled-empty', () => {
      mockUsePermissionedSwapPair.mockReturnValue(
        permissionedPair({ isPermissioned: false, inputAdapterAddress: undefined, permissionedSide: undefined }),
      )
      mockUseInfiniteQuery.mockReturnValue(listPools([]))

      const { result } = render()

      expect(result.current.recommendedHook).toBeUndefined()
    })

    it('never falls back when the chain has no sdk entry', () => {
      mockUseInfiniteQuery.mockReturnValue(listPools([]))

      const { result } = render({ chainId: 999999999 })

      expect(result.current.recommendedHook).toBeUndefined()
    })

    it("never falls back when the chain's sdk entry lacks the hooks address", () => {
      mockUseInfiniteQuery.mockReturnValue(listPools([]))

      // Mainnet's entry has permissionedV4HooksAddress stripped in the module mock above.
      const { result } = render({ chainId: 1 })

      expect(result.current.recommendedHook).toBeUndefined()
    })

    it('never falls back while the pools query is still loading', () => {
      mockUseInfiniteQuery.mockReturnValue({ data: undefined, isLoading: true })

      const { result } = render()

      expect(result.current.recommendedHook).toBeUndefined()
      expect(result.current.isLoading).toBe(true)
    })
  })
})

describe('useRecommendedHookPrefill', () => {
  const setPositionState = vi.fn()

  const hookedPools = listPools([rankedPool({ hook: HOOK_A.toLowerCase(), tvl: 10, liquidity: '100' })])

  type PrefillProps = {
    tokenA: Currency
    tokenB: Currency
    protocolVersion: ProtocolVersion
    hook: string | undefined
    urlHook: string | null | undefined
  }

  const defaultProps: PrefillProps = {
    tokenA: erc20(UNDERLYING),
    tokenB: erc20(WETH, SEPOLIA, 'WETH'),
    protocolVersion: ProtocolVersion.V4,
    hook: undefined,
    urlHook: undefined,
  }

  const renderPrefill = (initialProps: PrefillProps = defaultProps) =>
    renderHook((props: PrefillProps) => useRecommendedHookPrefill({ ...props, setPositionState }), { initialProps })

  beforeEach(() => {
    setPositionState.mockClear()
    mockUsePermissionedSwapPair.mockReturnValue(permissionedPair())
    mockUseInfiniteQuery.mockReturnValue(hookedPools)
  })

  it('prefills the recommended hook and resets fee for a permissioned pair', () => {
    renderPrefill()

    expect(setPositionState).toHaveBeenCalledTimes(1)
    const updater = setPositionState.mock.calls[0][0] as (state: PositionState) => PositionState
    const next = updater({ fee: { feeAmount: 3000, tickSpacing: 60 }, userApprovedHook: undefined } as PositionState)
    expect(next.hook).toBe(HOOK_A)
    expect(next.fee).toBeUndefined()
    // Parity with the ?hook= integrator path: the HookModal review still gates Continue.
    expect(next.userApprovedHook).toBeUndefined()
  })

  it('does not re-apply after the user clears the suggestion for the same pair', () => {
    const { rerender } = renderPrefill()
    expect(setPositionState).toHaveBeenCalledTimes(1)

    // Prefill landed in state...
    rerender({ ...defaultProps, hook: HOOK_A })
    // ...then the user cleared it.
    rerender({ ...defaultProps, hook: undefined })

    expect(setPositionState).toHaveBeenCalledTimes(1)
  })

  it('re-arms when the token pair changes', () => {
    const { rerender } = renderPrefill()
    expect(setPositionState).toHaveBeenCalledTimes(1)

    rerender({ ...defaultProps, tokenB: erc20('0x721c18B87340C11cd148624c6C5aaD2A95AA6168', SEPOLIA, 'PTOK2') })

    expect(setPositionState).toHaveBeenCalledTimes(2)
  })

  it('prefills the sdk fallback and resets fee for a first-ever pair (no pools yet)', () => {
    mockUseInfiniteQuery.mockReturnValue(listPools([]))

    renderPrefill()

    expect(setPositionState).toHaveBeenCalledTimes(1)
    const updater = setPositionState.mock.calls[0][0] as (state: PositionState) => PositionState
    const next = updater({ fee: { feeAmount: 3000, tickSpacing: 60 }, userApprovedHook: undefined } as PositionState)
    expect(next.hook).toBe(SDK_FALLBACK_HOOK)
    expect(next.fee).toBeUndefined()
    expect(next.userApprovedHook).toBeUndefined()
  })

  it('never applies when a hook came from the URL (integrator contract)', () => {
    renderPrefill({ ...defaultProps, urlHook: HOOK_B })

    expect(setPositionState).not.toHaveBeenCalled()
  })

  it('never applies the sdk fallback when a hook came from the URL', () => {
    mockUseInfiniteQuery.mockReturnValue(listPools([]))

    renderPrefill({ ...defaultProps, urlHook: HOOK_B })

    expect(setPositionState).not.toHaveBeenCalled()
  })

  it('never applies when a hook is already set', () => {
    renderPrefill({ ...defaultProps, hook: HOOK_B })

    expect(setPositionState).not.toHaveBeenCalled()
  })

  it('never applies outside v4', () => {
    renderPrefill({ ...defaultProps, protocolVersion: ProtocolVersion.V3 })

    expect(setPositionState).not.toHaveBeenCalled()
  })

  it('never applies for a non-permissioned pair', () => {
    mockUsePermissionedSwapPair.mockReturnValue(
      permissionedPair({ isPermissioned: false, inputAdapterAddress: undefined, permissionedSide: undefined }),
    )
    mockUseInfiniteQuery.mockReturnValue({ data: undefined, isLoading: false })

    renderPrefill()

    expect(setPositionState).not.toHaveBeenCalled()
  })
})
