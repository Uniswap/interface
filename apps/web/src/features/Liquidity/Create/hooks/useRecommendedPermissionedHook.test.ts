import { renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import {
  useRecommendedHookPrefill,
  useRecommendedPermissionedHook,
} from '~/features/Liquidity/Create/hooks/useRecommendedPermissionedHook'
import type { PositionState } from '~/features/Liquidity/Create/types'

// Real EIP-55 checksum (computed via viem getAddress); the mocked map stores it lowercase.
const SDK_FALLBACK_HOOK = vi.hoisted(() => '0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD')

const { mockUseActiveAddress, mockUsePermissionedSwapPair, mockUseGetPoolsByTokens } = vi.hoisted(() => ({
  mockUseActiveAddress: vi.fn(),
  mockUsePermissionedSwapPair: vi.fn(),
  mockUseGetPoolsByTokens: vi.fn(),
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

vi.mock('uniswap/src/data/apiClients/dataApiService/pools/getPools', () => ({
  useGetPoolsByTokens: mockUseGetPoolsByTokens,
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

const pool = ({
  hook,
  tvl,
  liquidity,
}: {
  hook: string | undefined
  tvl: string
  liquidity: string
}): Record<string, unknown> => ({
  poolId: '0xpool',
  hooks: hook ? { address: hook } : undefined,
  totalLiquidityUsd: tvl,
  liquidity,
})

const permissionedPair = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  isPermissioned: true,
  isAllowlisted: true,
  isLoading: false,
  permissionedSide: 'input',
  inputAdapterAddress: ADAPTER,
  outputAdapterAddress: undefined,
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  mockUseActiveAddress.mockReturnValue(WALLET)
  mockUseGetPoolsByTokens.mockReturnValue({ data: undefined, isLoading: false })
})

describe('useRecommendedPermissionedHook', () => {
  it('queries pools by the sorted adapter-mapped pair, not the displayed sec-token', () => {
    mockUsePermissionedSwapPair.mockReturnValue(permissionedPair())

    renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(UNDERLYING), tokenB: erc20(WETH, SEPOLIA, 'WETH') }),
    )

    expect(mockUseGetPoolsByTokens).toHaveBeenCalledWith(
      {
        chainId: SEPOLIA,
        protocolVersions: [ProtocolVersion.V4],
        token0: ADAPTER.toLowerCase(),
        token1: WETH.toLowerCase(),
      },
      true,
    )
  })

  it('sorts the pair when the adapter-mapped addresses arrive out of order', () => {
    mockUsePermissionedSwapPair.mockReturnValue(
      permissionedPair({ inputAdapterAddress: undefined, outputAdapterAddress: ADAPTER, permissionedSide: 'output' }),
    )

    // tokenA = WETH (0xfff9... sorts AFTER the adapter 0xef1d...), tokenB = permissioned.
    renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(WETH, SEPOLIA, 'WETH'), tokenB: erc20(UNDERLYING) }),
    )

    expect(mockUseGetPoolsByTokens).toHaveBeenCalledWith(
      expect.objectContaining({ token0: ADAPTER.toLowerCase(), token1: WETH.toLowerCase() }),
      true,
    )
  })

  it('returns the deepest hooked pool, skipping zero-address hooks, checksummed', () => {
    mockUsePermissionedSwapPair.mockReturnValue(permissionedPair())
    mockUseGetPoolsByTokens.mockReturnValue({
      data: {
        pools: [
          pool({ hook: ZERO, tvl: '999999', liquidity: '999999999' }),
          pool({
            hook: HOOK_A.toLowerCase(),
            tvl: '0.00000000000000000000000000003109',
            liquidity: '42426406871192851',
          }),
          pool({
            hook: HOOK_B.toLowerCase(),
            tvl: '0.0000000000000000000000000001219',
            liquidity: '131182587173364053',
          }),
        ],
      },
      isLoading: false,
    })

    const { result } = renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(UNDERLYING), tokenB: erc20(WETH, SEPOLIA, 'WETH') }),
    )

    expect(result.current.recommendedHook).toBe(HOOK_B)
  })

  it('breaks TVL ties on raw liquidity', () => {
    mockUsePermissionedSwapPair.mockReturnValue(permissionedPair())
    mockUseGetPoolsByTokens.mockReturnValue({
      data: {
        pools: [
          pool({ hook: HOOK_A.toLowerCase(), tvl: '0', liquidity: '200' }),
          pool({ hook: HOOK_B.toLowerCase(), tvl: '0', liquidity: '100' }),
        ],
      },
      isLoading: false,
    })

    const { result } = renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(UNDERLYING), tokenB: erc20(WETH, SEPOLIA, 'WETH') }),
    )

    expect(result.current.recommendedHook).toBe(HOOK_A)
  })

  it('disables the pool query and returns undefined when the pair is not permissioned', () => {
    mockUsePermissionedSwapPair.mockReturnValue(
      permissionedPair({ isPermissioned: false, inputAdapterAddress: undefined, permissionedSide: undefined }),
    )

    const { result } = renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(UNDERLYING), tokenB: erc20(WETH, SEPOLIA, 'WETH') }),
    )

    expect(mockUseGetPoolsByTokens).toHaveBeenCalledWith(expect.anything(), false)
    expect(result.current.recommendedHook).toBeUndefined()
  })

  it('disables the pool query for a cross-chain pair', () => {
    mockUsePermissionedSwapPair.mockReturnValue(permissionedPair())

    renderHook(() =>
      useRecommendedPermissionedHook({ tokenA: erc20(UNDERLYING, SEPOLIA), tokenB: erc20(WETH, 1, 'WETH') }),
    )

    expect(mockUseGetPoolsByTokens).toHaveBeenCalledWith(expect.anything(), false)
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
      mockUseGetPoolsByTokens.mockReturnValue({
        data: { pools: [pool({ hook: ZERO, tvl: '100', liquidity: '100' })] },
        isLoading: false,
      })

      const { result } = render()

      expect(result.current.recommendedHook).toBe(SDK_FALLBACK_HOOK)
    })

    it('falls back when the query settles with zero pools (first-ever pair)', () => {
      mockUseGetPoolsByTokens.mockReturnValue({ data: { pools: [] }, isLoading: false })

      const { result } = render()

      expect(result.current.recommendedHook).toBe(SDK_FALLBACK_HOOK)
    })

    it('falls back on query error (settled-empty semantics)', () => {
      mockUseGetPoolsByTokens.mockReturnValue({ data: undefined, isLoading: false, isError: true })

      const { result } = render()

      expect(result.current.recommendedHook).toBe(SDK_FALLBACK_HOOK)
    })

    it('prefers the discovered hook over the sdk fallback when a hooked pool exists', () => {
      mockUseGetPoolsByTokens.mockReturnValue({
        data: { pools: [pool({ hook: HOOK_A.toLowerCase(), tvl: '10', liquidity: '100' })] },
        isLoading: false,
      })

      const { result } = render()

      expect(result.current.recommendedHook).toBe(HOOK_A)
    })

    it('never falls back for a non-permissioned pair, even settled-empty', () => {
      mockUsePermissionedSwapPair.mockReturnValue(
        permissionedPair({ isPermissioned: false, inputAdapterAddress: undefined, permissionedSide: undefined }),
      )
      mockUseGetPoolsByTokens.mockReturnValue({ data: { pools: [] }, isLoading: false })

      const { result } = render()

      expect(result.current.recommendedHook).toBeUndefined()
    })

    it('never falls back when the chain has no sdk entry', () => {
      mockUseGetPoolsByTokens.mockReturnValue({ data: { pools: [] }, isLoading: false })

      const { result } = render({ chainId: 999999999 })

      expect(result.current.recommendedHook).toBeUndefined()
    })

    it("never falls back when the chain's sdk entry lacks the hooks address", () => {
      mockUseGetPoolsByTokens.mockReturnValue({ data: { pools: [] }, isLoading: false })

      // Mainnet's entry has permissionedV4HooksAddress stripped in the module mock above.
      const { result } = render({ chainId: 1 })

      expect(result.current.recommendedHook).toBeUndefined()
    })

    it('never falls back while the pools query is still loading', () => {
      mockUseGetPoolsByTokens.mockReturnValue({ data: undefined, isLoading: true })

      const { result } = render()

      expect(result.current.recommendedHook).toBeUndefined()
      expect(result.current.isLoading).toBe(true)
    })
  })
})

describe('useRecommendedHookPrefill', () => {
  const setPositionState = vi.fn()

  const hookedPools = {
    data: { pools: [pool({ hook: HOOK_A.toLowerCase(), tvl: '10', liquidity: '100' })] },
    isLoading: false,
  }

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
    mockUseGetPoolsByTokens.mockReturnValue(hookedPools)
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
    mockUseGetPoolsByTokens.mockReturnValue({ data: { pools: [] }, isLoading: false })

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
    mockUseGetPoolsByTokens.mockReturnValue({ data: { pools: [] }, isLoading: false })

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
    mockUseGetPoolsByTokens.mockReturnValue({ data: undefined, isLoading: false })

    renderPrefill()

    expect(setPositionState).not.toHaveBeenCalled()
  })
})
