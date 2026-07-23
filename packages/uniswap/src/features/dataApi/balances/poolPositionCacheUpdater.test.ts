import type { GetWalletBalancesResponse, WalletBalance } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { SharedQueryClient } from '@universe/api'
import { getWalletBalancesQuery } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePoolPositionCacheUpdater } from 'uniswap/src/features/dataApi/balances/poolPositionCacheUpdater'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { renderHookWithProviders } from 'uniswap/src/test/render'

const { mockUseEnabledChains, mockUseRestPortfolioValueModifier } = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockUseRestPortfolioValueModifier: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/balances/balancesRest')>()),
  useRestPortfolioValueModifier: mockUseRestPortfolioValueModifier,
}))

const EVM_ADDRESS = '0xuser'

const positionInfo = (overrides: Partial<PositionInfo> = {}): PositionInfo =>
  ({
    poolId: '0xPool',
    tokenId: '1',
    chainId: UniverseChainId.Mainnet,
    version: ProtocolVersion.V3,
    totalValueUsd: 250,
    ...overrides,
  }) as PositionInfo

function makeWalletBalanceResponse(values: {
  totalUsd: number
  poolsUsd: number
  poolsCount: number
  tokensUsd?: number
  tokensCount?: number
}): GetWalletBalancesResponse {
  return {
    balance: {
      total: { valueUsd: values.totalUsd },
      tokens: { valueUsd: values.tokensUsd ?? 0, count: values.tokensCount ?? 0 },
      pools: { valueUsd: values.poolsUsd, count: values.poolsCount },
    } as unknown as WalletBalance,
  } as GetWalletBalancesResponse
}

describe(usePoolPositionCacheUpdater, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet], isTestnetModeEnabled: false })
    mockUseRestPortfolioValueModifier.mockReturnValue(undefined)
    SharedQueryClient.clear()
  })

  function primeWalletBalancesCache(response: GetWalletBalancesResponse): readonly unknown[] {
    const queryKey = getWalletBalancesQuery({
      input: { evmAddress: EVM_ADDRESS, chainIds: [UniverseChainId.Mainnet], modifier: undefined },
    }).queryKey
    SharedQueryClient.setQueryData<GetWalletBalancesResponse>(queryKey, response)
    return queryKey
  }

  it('subtracts position USD + count when hiding', () => {
    const queryKey = primeWalletBalancesCache(
      makeWalletBalanceResponse({ totalUsd: 1000, poolsUsd: 400, poolsCount: 3 }),
    )

    const { result } = renderHookWithProviders(() => usePoolPositionCacheUpdater(EVM_ADDRESS))
    result.current(true, positionInfo({ totalValueUsd: 250 }))

    const after = SharedQueryClient.getQueryData<GetWalletBalancesResponse>(queryKey)
    expect(after?.balance?.pools?.valueUsd).toBe(150)
    expect(after?.balance?.pools?.count).toBe(2)
    expect(after?.balance?.total?.valueUsd).toBe(750)
  })

  it('adds position USD + count when unhiding', () => {
    const queryKey = primeWalletBalancesCache(
      makeWalletBalanceResponse({ totalUsd: 1000, poolsUsd: 400, poolsCount: 3 }),
    )

    const { result } = renderHookWithProviders(() => usePoolPositionCacheUpdater(EVM_ADDRESS))
    result.current(false, positionInfo({ totalValueUsd: 250 }))

    const after = SharedQueryClient.getQueryData<GetWalletBalancesResponse>(queryKey)
    expect(after?.balance?.pools?.valueUsd).toBe(650)
    expect(after?.balance?.pools?.count).toBe(4)
    expect(after?.balance?.total?.valueUsd).toBe(1250)
  })

  it('leaves the tokens part untouched on a pool toggle', () => {
    const queryKey = primeWalletBalancesCache(
      makeWalletBalanceResponse({ totalUsd: 1000, poolsUsd: 400, poolsCount: 3, tokensUsd: 600, tokensCount: 5 }),
    )

    const { result } = renderHookWithProviders(() => usePoolPositionCacheUpdater(EVM_ADDRESS))
    result.current(true, positionInfo({ totalValueUsd: 100 }))

    const after = SharedQueryClient.getQueryData<GetWalletBalancesResponse>(queryKey)
    expect(after?.balance?.tokens?.valueUsd).toBe(600)
    expect(after?.balance?.tokens?.count).toBe(5)
  })

  it('falls back to USD delta 0 when position.totalValueUsd is missing but still moves count', () => {
    const queryKey = primeWalletBalancesCache(
      makeWalletBalanceResponse({ totalUsd: 1000, poolsUsd: 400, poolsCount: 3 }),
    )

    const { result } = renderHookWithProviders(() => usePoolPositionCacheUpdater(EVM_ADDRESS))
    result.current(true, positionInfo({ totalValueUsd: undefined }))

    const after = SharedQueryClient.getQueryData<GetWalletBalancesResponse>(queryKey)
    expect(after?.balance?.pools?.valueUsd).toBe(400)
    expect(after?.balance?.pools?.count).toBe(2)
    expect(after?.balance?.total?.valueUsd).toBe(1000)
  })

  it('clamps pools count at 0 on repeated hide', () => {
    const queryKey = primeWalletBalancesCache(
      makeWalletBalanceResponse({ totalUsd: 100, poolsUsd: 100, poolsCount: 1 }),
    )

    const { result } = renderHookWithProviders(() => usePoolPositionCacheUpdater(EVM_ADDRESS))
    result.current(true, positionInfo({ totalValueUsd: 100 }))
    result.current(true, positionInfo({ totalValueUsd: 100 }))

    const after = SharedQueryClient.getQueryData<GetWalletBalancesResponse>(queryKey)
    expect(after?.balance?.pools?.count).toBe(0)
  })
})
