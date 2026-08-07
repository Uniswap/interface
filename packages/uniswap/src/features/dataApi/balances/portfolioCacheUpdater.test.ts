import {
  type GetPortfolioResponse,
  type GetWalletBalancesResponse,
  WalletBalanceCategory,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { SharedQueryClient } from '@universe/api'
import { FeatureFlags } from '@universe/gating'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { getPortfolioQuery } from 'uniswap/src/data/apiClients/dataApiService/balances/getPortfolio'
import { getWalletBalancesQuery } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  createPortfolioCacheUpdater,
  usePortfolioCacheUpdater,
} from 'uniswap/src/features/dataApi/balances/portfolioCacheUpdater'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { DAI_CURRENCY_INFO, UNI_CURRENCY_INFO } from 'uniswap/src/test/fixtures'
import { renderHookWithProviders } from 'uniswap/src/test/render'

const { mockUseEnabledChains, mockUseRestPortfolioValueModifier, mockPoolsFlagEnabled, mockEarnFlagEnabled } =
  vi.hoisted(() => ({
    mockUseEnabledChains: vi.fn(),
    mockUseRestPortfolioValueModifier: vi.fn(),
    mockPoolsFlagEnabled: { value: false },
    mockEarnFlagEnabled: { value: false },
  }))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/balances/balancesRest')>()),
  useRestPortfolioValueModifier: mockUseRestPortfolioValueModifier,
}))

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  const readPoolsFlag = (flag: FeatureFlags): boolean =>
    flag === FeatureFlags.PortfolioPoolsBalances ? mockPoolsFlagEnabled.value : false
  return {
    ...actual,
    useFeatureFlag: (flag: FeatureFlags) =>
      flag === FeatureFlags.Earn || flag === FeatureFlags.ChainedActions
        ? mockEarnFlagEnabled.value
        : readPoolsFlag(flag),
    // useWalletBalancesIncludeCategories reads the pools flag via the exposure-disabled variant.
    useFeatureFlagWithExposureLoggingDisabled: readPoolsFlag,
  }
})

const mainnetNativeAddress = getNativeAddress(UniverseChainId.Mainnet)

const mockPortfolioData = {
  portfolio: {
    balances: [
      { token: { address: mainnetNativeAddress, chainId: 1 }, amount: { amount: 1 }, isHidden: false },
      { token: { address: '0x2', chainId: 1 }, amount: { amount: 2 }, isHidden: false },
      { token: { address: mainnetNativeAddress, chainId: 1 }, amount: { amount: 3 }, isHidden: true },
    ],
    totalValueUsd: 300,
  },
}

const mockPortfolioBalance1: PortfolioBalance = {
  balanceUSD: 100,
  cacheId: 'TokenBalance:1-0x1-0xuser',
  currencyInfo: UNI_CURRENCY_INFO,
  id: '1-0x1-0xuser',
  isHidden: false,
  quantity: 1,
  relativeChange24: 2.5,
}

const mockPortfolioBalance2: PortfolioBalance = {
  balanceUSD: 200,
  cacheId: 'TokenBalance:1-0x3-0xuser',
  currencyInfo: DAI_CURRENCY_INFO,
  id: '1-0x3-0xuser',
  isHidden: false,
  quantity: 1,
  relativeChange24: 0,
}

describe(createPortfolioCacheUpdater, () => {
  it('updates balance visibility and total value when hiding', () => {
    const ctx = { updateData: vi.fn() }

    const updater = createPortfolioCacheUpdater(ctx)({
      evmAddress: '0xuser',
      chainIds: [1, 2],
    })

    updater({ hidden: true, portfolioBalance: mockPortfolioBalance1 })

    const updaterFn = ctx.updateData.mock.calls[0]![0].updater
    const result = updaterFn(mockPortfolioData)

    expect(result.portfolio.balances[0].isHidden).toBe(true)
    expect(result.portfolio.balances[1].isHidden).toBe(false)
    expect(result.portfolio.balances[2].isHidden).toBe(true)
    expect(result.portfolio.totalValueUsd).toBe(200)
  })

  it('updates balance visibility and total value when un-hiding', () => {
    const ctx = { updateData: vi.fn() }

    const updater = createPortfolioCacheUpdater(ctx)({
      evmAddress: '0xuser',
      chainIds: [1, 2],
    })

    updater({ hidden: false, portfolioBalance: mockPortfolioBalance2 })

    const updaterFn = ctx.updateData.mock.calls[0]![0].updater
    const result = updaterFn(mockPortfolioData)

    expect(result.portfolio.balances[0].isHidden).toBe(false)
    expect(result.portfolio.balances[1].isHidden).toBe(false)
    expect(result.portfolio.balances[2].isHidden).toBe(false)
    expect(result.portfolio.totalValueUsd).toBe(500)
  })

  it('updates matching chain balances inside multichain entries', () => {
    const ctx = { updateData: vi.fn() }
    const multichainData = {
      portfolio: {
        balances: [],
        multichainBalances: [
          {
            symbol: 'ETH',
            chainBalances: [
              { chainId: 1, address: mainnetNativeAddress, isHidden: false },
              { chainId: 10, address: mainnetNativeAddress, isHidden: false },
            ],
          },
          {
            symbol: 'OTHER',
            chainBalances: [{ chainId: 1, address: '0x2', isHidden: false }],
          },
        ],
        totalValueUsd: 300,
      },
    }

    const updater = createPortfolioCacheUpdater(ctx)({
      evmAddress: '0xuser',
      chainIds: [1, 10],
    })
    updater({ hidden: true, portfolioBalance: mockPortfolioBalance1 })

    const updaterFn = ctx.updateData.mock.calls[0]![0].updater
    const result = updaterFn(multichainData)

    // Only the mainnet native chain balance matches the hidden currency.
    expect(result.portfolio.multichainBalances[0].chainBalances[0].isHidden).toBe(true)
    expect(result.portfolio.multichainBalances[0].chainBalances[1].isHidden).toBe(false)
    expect(result.portfolio.multichainBalances[1].chainBalances[0].isHidden).toBe(false)
    expect(result.portfolio.totalValueUsd).toBe(200)
  })

  it('leaves data-less entries untouched by returning undefined from the updater', () => {
    const ctx = { updateData: vi.fn() }

    const updater = createPortfolioCacheUpdater(ctx)({ evmAddress: '0xuser', chainIds: [1, 2] })
    updater({ hidden: true, portfolioBalance: mockPortfolioBalance1 })

    const updaterFn = ctx.updateData.mock.calls[0]![0].updater
    expect(updaterFn(undefined)).toBeUndefined()
  })

  it('forwards a negative USD delta and the originating input to updateWalletBalancesForDelta when hiding', () => {
    const updateWalletBalancesForDelta = vi.fn()
    const ctx = {
      updateData: vi.fn(),
      updateWalletBalancesForDelta,
    }
    const input = { evmAddress: '0xuser', chainIds: [1, 2] }

    const updater = createPortfolioCacheUpdater(ctx)(input)
    updater({ hidden: true, portfolioBalance: mockPortfolioBalance1 })

    expect(updateWalletBalancesForDelta).toHaveBeenCalledTimes(1)
    expect(updateWalletBalancesForDelta).toHaveBeenCalledWith({
      input,
      deltaUsd: -mockPortfolioBalance1.balanceUSD!,
      chainId: mockPortfolioBalance1.currencyInfo.currency.chainId,
    })
  })

  it('forwards a positive USD delta and the originating input to updateWalletBalancesForDelta when un-hiding', () => {
    const updateWalletBalancesForDelta = vi.fn()
    const ctx = {
      updateData: vi.fn(),
      updateWalletBalancesForDelta,
    }
    const input = { evmAddress: '0xuser', chainIds: [1, 2] }

    const updater = createPortfolioCacheUpdater(ctx)(input)
    updater({ hidden: false, portfolioBalance: mockPortfolioBalance2 })

    expect(updateWalletBalancesForDelta).toHaveBeenCalledTimes(1)
    expect(updateWalletBalancesForDelta).toHaveBeenCalledWith({
      input,
      deltaUsd: mockPortfolioBalance2.balanceUSD!,
      chainId: mockPortfolioBalance2.currencyInfo.currency.chainId,
    })
  })

  it('does not call updateWalletBalancesForDelta when no portfolioBalance is provided', () => {
    const updateWalletBalancesForDelta = vi.fn()
    const ctx = {
      updateData: vi.fn(),
      updateWalletBalancesForDelta,
    }

    const updater = createPortfolioCacheUpdater(ctx)({ evmAddress: '0xuser', chainIds: [1, 2] })
    updater({ hidden: true })

    expect(updateWalletBalancesForDelta).not.toHaveBeenCalled()
  })

  it('forwards the delta even when no GetPortfolio entry holds data', () => {
    const updateWalletBalancesForDelta = vi.fn()
    const ctx = {
      updateData: vi.fn(),
      updateWalletBalancesForDelta,
    }

    const updater = createPortfolioCacheUpdater(ctx)({ evmAddress: '0xuser', chainIds: [1, 2] })
    updater({ hidden: true, portfolioBalance: mockPortfolioBalance1 })

    expect(updateWalletBalancesForDelta).toHaveBeenCalledTimes(1)
  })
})

type WalletBalancesShape = {
  balance: {
    total: { valueUsd: number }
    tokens: { valueUsd: number }
    pools: { valueUsd: number }
    earn: { valueUsd: number }
  }
}

function makeWalletBalances(total: number, tokens: number, pools: number): GetWalletBalancesResponse {
  return {
    balance: {
      total: { valueUsd: total },
      tokens: { valueUsd: tokens },
      pools: { valueUsd: pools },
      earn: { valueUsd: 75 },
    },
  } as unknown as GetWalletBalancesResponse
}

describe(usePortfolioCacheUpdater, () => {
  const EVM_ADDR = '0xuser'
  // Non-trivial modifier: if either query helper accidentally folds `modifier` into the cache
  // key, priming and hook-time keys will diverge and the dual-cache assertions below will fail.
  const modifier = { includeSpamTokens: false }
  const hookInput = {
    evmAddress: EVM_ADDR,
    svmAddress: undefined,
    chainIds: [UniverseChainId.Mainnet],
    modifier,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    SharedQueryClient.clear()
    mockPoolsFlagEnabled.value = false
    mockEarnFlagEnabled.value = false
    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet] })
    mockUseRestPortfolioValueModifier.mockReturnValue(modifier)
  })

  afterEach(() => {
    SharedQueryClient.clear()
  })

  // The updater's cache writes land after it awaits query cancellation; flush one tick to observe them.
  const flushUpdater = async (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

  // The wallet-balances entry the header reads is keyed by `includeCategories`, so the optimistic
  // token-side write must carry the same categories the rendered query used. Prime that exact key.
  // The GetPortfolio entry is primed under a `multichain: true` key variant the updater never
  // builds itself — the rendered hooks key on inputs the updater doesn't know, so these tests
  // fail if the updater regresses to exact-key writes.
  function primeCaches(includeCategories: WalletBalanceCategory[] = []): {
    portfolioKey: readonly unknown[]
    walletBalancesKey: readonly unknown[]
  } {
    const portfolioKey = getPortfolioQuery({ input: { ...hookInput, multichain: true } }).queryKey
    const walletBalancesKey = getWalletBalancesQuery({ input: { ...hookInput, includeCategories } }).queryKey
    SharedQueryClient.setQueryData(portfolioKey, mockPortfolioData as unknown as GetPortfolioResponse)
    SharedQueryClient.setQueryData(walletBalancesKey, makeWalletBalances(1000, 600, 400))
    return { portfolioKey, walletBalancesKey }
  }

  it('mutates both the GetPortfolio and GetWalletBalances caches when hiding a token', async () => {
    const { portfolioKey, walletBalancesKey } = primeCaches()

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(true, mockPortfolioBalance1)
    await flushUpdater()

    const portfolioAfter = SharedQueryClient.getQueryData<typeof mockPortfolioData>(portfolioKey)
    expect(portfolioAfter?.portfolio.balances[0]?.isHidden).toBe(true)
    expect(portfolioAfter?.portfolio.totalValueUsd).toBe(200)

    const walletAfter = SharedQueryClient.getQueryData<WalletBalancesShape>(walletBalancesKey)
    expect(walletAfter?.balance.total.valueUsd).toBe(900)
    expect(walletAfter?.balance.tokens.valueUsd).toBe(500)
    expect(walletAfter?.balance.pools.valueUsd).toBe(400)
  })

  it('targets the pools-inclusive wallet balances cache entry when the pools flag is on', async () => {
    mockPoolsFlagEnabled.value = true
    const { walletBalancesKey } = primeCaches([WalletBalanceCategory.POOLS])

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(true, mockPortfolioBalance1)
    await flushUpdater()

    const walletAfter = SharedQueryClient.getQueryData<WalletBalancesShape>(walletBalancesKey)
    expect(walletAfter?.balance.total.valueUsd).toBe(900)
    expect(walletAfter?.balance.tokens.valueUsd).toBe(500)
    expect(walletAfter?.balance.pools.valueUsd).toBe(400)
  })

  it('targets the earn-inclusive wallet balances cache entry when the earn flag is on', async () => {
    mockEarnFlagEnabled.value = true
    const { walletBalancesKey } = primeCaches([WalletBalanceCategory.EARN_VAULTS])

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(true, mockPortfolioBalance1)
    await flushUpdater()

    const walletAfter = SharedQueryClient.getQueryData<WalletBalancesShape>(walletBalancesKey)
    expect(walletAfter?.balance.total.valueUsd).toBe(900)
    expect(walletAfter?.balance.tokens.valueUsd).toBe(500)
    expect(walletAfter?.balance.pools.valueUsd).toBe(400)
    expect(walletAfter?.balance.earn.valueUsd).toBe(75)
  })

  it('targets the pools-and-earn wallet balances cache entry when both flags are on', async () => {
    mockPoolsFlagEnabled.value = true
    mockEarnFlagEnabled.value = true
    const { walletBalancesKey } = primeCaches([WalletBalanceCategory.POOLS, WalletBalanceCategory.EARN_VAULTS])

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(true, mockPortfolioBalance1)
    await flushUpdater()

    const walletAfter = SharedQueryClient.getQueryData<WalletBalancesShape>(walletBalancesKey)
    expect(walletAfter?.balance.total.valueUsd).toBe(900)
    expect(walletAfter?.balance.tokens.valueUsd).toBe(500)
    expect(walletAfter?.balance.pools.valueUsd).toBe(400)
    expect(walletAfter?.balance.earn.valueUsd).toBe(75)
  })

  it('applies the delta to every wallet balances entry covering the token chain, across categories', async () => {
    mockPoolsFlagEnabled.value = true
    const { walletBalancesKey } = primeCaches([WalletBalanceCategory.POOLS])
    const tokensOnlyKey = getWalletBalancesQuery({ input: { ...hookInput, includeCategories: [] } }).queryKey
    SharedQueryClient.setQueryData(tokensOnlyKey, makeWalletBalances(2000, 1500, 500))

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(true, mockPortfolioBalance1)
    await flushUpdater()

    const poolsInclusive = SharedQueryClient.getQueryData<WalletBalancesShape>(walletBalancesKey)
    expect(poolsInclusive?.balance.total.valueUsd).toBe(900)
    expect(poolsInclusive?.balance.tokens.valueUsd).toBe(500)
    const tokensOnly = SharedQueryClient.getQueryData<WalletBalancesShape>(tokensOnlyKey)
    expect(tokensOnly?.balance.total.valueUsd).toBe(1900)
    expect(tokensOnly?.balance.tokens.valueUsd).toBe(1400)
    expect(tokensOnly?.balance.pools.valueUsd).toBe(500)
  })

  it('updates chain-filtered entries covering the token chain and skips entries that do not', async () => {
    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet, UniverseChainId.Optimism] })
    const allChainsInput = { ...hookInput, chainIds: [UniverseChainId.Mainnet, UniverseChainId.Optimism] }
    SharedQueryClient.setQueryData(
      getPortfolioQuery({ input: allChainsInput }).queryKey,
      mockPortfolioData as unknown as GetPortfolioResponse,
    )
    const mainnetOnlyKey = getWalletBalancesQuery({
      input: { ...hookInput, chainIds: [UniverseChainId.Mainnet], includeCategories: [] },
    }).queryKey
    const optimismOnlyKey = getWalletBalancesQuery({
      input: { ...hookInput, chainIds: [UniverseChainId.Optimism], includeCategories: [] },
    }).queryKey
    SharedQueryClient.setQueryData(mainnetOnlyKey, makeWalletBalances(800, 500, 300))
    SharedQueryClient.setQueryData(optimismOnlyKey, makeWalletBalances(200, 100, 100))

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(true, mockPortfolioBalance1)
    await flushUpdater()

    // The chain-filtered entry covering the hidden token's chain (Mainnet) is mutated.
    const mainnetOnly = SharedQueryClient.getQueryData<WalletBalancesShape>(mainnetOnlyKey)
    expect(mainnetOnly?.balance.total.valueUsd).toBe(700)
    expect(mainnetOnly?.balance.tokens.valueUsd).toBe(400)
    // The entry filtered to a chain the token doesn't live on is left as-is.
    const optimismOnly = SharedQueryClient.getQueryData<WalletBalancesShape>(optimismOnlyKey)
    expect(optimismOnly?.balance.total.valueUsd).toBe(200)
    expect(optimismOnly?.balance.tokens.valueUsd).toBe(100)
  })

  it('leaves chain-filtered GetPortfolio entries that do not cover the token chain untouched', async () => {
    const { portfolioKey } = primeCaches()
    const optimismOnlyPortfolioKey = getPortfolioQuery({
      input: { ...hookInput, chainIds: [UniverseChainId.Optimism], multichain: true },
    }).queryKey
    SharedQueryClient.setQueryData(optimismOnlyPortfolioKey, mockPortfolioData as unknown as GetPortfolioResponse)

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(true, mockPortfolioBalance1)
    await flushUpdater()

    // The entry covering the token's chain (Mainnet) is mutated; the Optimism-only entry is not.
    const covering = SharedQueryClient.getQueryData<typeof mockPortfolioData>(portfolioKey)
    expect(covering?.portfolio.totalValueUsd).toBe(200)
    expect(SharedQueryClient.getQueryData(optimismOnlyPortfolioKey)).toEqual(mockPortfolioData)
  })

  it('cancels in-flight balance queries first, then schedules a reconciling invalidation', async () => {
    primeCaches()
    // Drain deferred invalidations scheduled by earlier tests so the spy only sees this test's.
    await new Promise((resolve) => setTimeout(resolve, 0))
    const cancelSpy = vi.spyOn(SharedQueryClient, 'cancelQueries')
    const invalidateSpy = vi.spyOn(SharedQueryClient, 'invalidateQueries')

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(true, mockPortfolioBalance1)
    await flushUpdater()

    expect(cancelSpy).toHaveBeenCalledTimes(1)
    // Invalidation is deferred a tick so observers pick up the new visibility state first.
    expect(invalidateSpy).not.toHaveBeenCalled()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(invalidateSpy).toHaveBeenCalledTimes(1)

    cancelSpy.mockRestore()
    invalidateSpy.mockRestore()
  })

  it('mutates both caches in the opposite direction when un-hiding a token', async () => {
    const { portfolioKey, walletBalancesKey } = primeCaches()

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(false, mockPortfolioBalance2)
    await flushUpdater()

    const portfolioAfter = SharedQueryClient.getQueryData<typeof mockPortfolioData>(portfolioKey)
    expect(portfolioAfter?.portfolio.totalValueUsd).toBe(500)

    const walletAfter = SharedQueryClient.getQueryData<WalletBalancesShape>(walletBalancesKey)
    expect(walletAfter?.balance.total.valueUsd).toBe(1200)
    expect(walletAfter?.balance.tokens.valueUsd).toBe(800)
    expect(walletAfter?.balance.pools.valueUsd).toBe(400)
  })

  it('leaves both caches untouched when no portfolioBalance is provided', async () => {
    const { portfolioKey, walletBalancesKey } = primeCaches()

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(true)
    await flushUpdater()

    expect(SharedQueryClient.getQueryData(portfolioKey)).toEqual(mockPortfolioData)
    const walletAfter = SharedQueryClient.getQueryData<WalletBalancesShape>(walletBalancesKey)
    expect(walletAfter?.balance.total.valueUsd).toBe(1000)
    expect(walletAfter?.balance.tokens.valueUsd).toBe(600)
    expect(walletAfter?.balance.pools.valueUsd).toBe(400)
  })
})
