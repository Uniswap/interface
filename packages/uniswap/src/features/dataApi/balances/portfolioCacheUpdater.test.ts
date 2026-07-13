import {
  type GetPortfolioResponse,
  type GetWalletBalancesResponse,
  WalletBalanceCategory,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { SharedQueryClient } from '@universe/api'
import { FeatureFlags } from '@universe/gating'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { getPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import { getWalletBalancesQuery } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  createPortfolioCacheUpdater,
  usePortfolioCacheUpdater,
} from 'uniswap/src/features/dataApi/balances/portfolioCacheUpdater'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { DAI_CURRENCY_INFO, UNI_CURRENCY_INFO } from 'uniswap/src/test/fixtures'
import { renderHookWithProviders } from 'uniswap/src/test/render'

const { mockUseEnabledChains, mockUseRestPortfolioValueModifier, mockPoolsFlagEnabled } = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockUseRestPortfolioValueModifier: vi.fn(),
  mockPoolsFlagEnabled: { value: false },
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
    useFeatureFlag: readPoolsFlag,
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
    const ctx = {
      getCurrentData: vi.fn().mockReturnValue(mockPortfolioData),
      updateData: vi.fn(),
    }

    const updater = createPortfolioCacheUpdater(ctx)({
      evmAddress: '0xuser',
      chainIds: [1, 2],
    })

    updater({ hidden: true, portfolioBalance: mockPortfolioBalance1 })

    expect(ctx.getCurrentData).toHaveBeenCalledWith({
      evmAddress: '0xuser',
      chainIds: [1, 2],
    })

    const updaterFn = ctx.updateData.mock.calls[0]![1]
    const result = updaterFn(mockPortfolioData)

    expect(result.portfolio.balances[0].isHidden).toBe(true)
    expect(result.portfolio.balances[1].isHidden).toBe(false)
    expect(result.portfolio.balances[2].isHidden).toBe(true)
    expect(result.portfolio.totalValueUsd).toBe(200)
  })

  it('updates balance visibility and total value when un-hiding', () => {
    const ctx = {
      getCurrentData: vi.fn().mockReturnValue(mockPortfolioData),
      updateData: vi.fn(),
    }

    const updater = createPortfolioCacheUpdater(ctx)({
      evmAddress: '0xuser',
      chainIds: [1, 2],
    })

    updater({ hidden: false, portfolioBalance: mockPortfolioBalance2 })

    expect(ctx.getCurrentData).toHaveBeenCalledWith({
      evmAddress: '0xuser',
      chainIds: [1, 2],
    })

    const updaterFn = ctx.updateData.mock.calls[0]![1]
    const result = updaterFn(mockPortfolioData)

    expect(result.portfolio.balances[0].isHidden).toBe(false)
    expect(result.portfolio.balances[1].isHidden).toBe(false)
    expect(result.portfolio.balances[2].isHidden).toBe(false)
    expect(result.portfolio.totalValueUsd).toBe(500)
  })

  it('forwards a negative USD delta and the originating input to updateWalletBalancesForDelta when hiding', () => {
    const updateWalletBalancesForDelta = vi.fn()
    const ctx = {
      getCurrentData: vi.fn().mockReturnValue(mockPortfolioData),
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
    })
  })

  it('forwards a positive USD delta and the originating input to updateWalletBalancesForDelta when un-hiding', () => {
    const updateWalletBalancesForDelta = vi.fn()
    const ctx = {
      getCurrentData: vi.fn().mockReturnValue(mockPortfolioData),
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
    })
  })

  it('does not call updateWalletBalancesForDelta when no portfolioBalance is provided', () => {
    const updateWalletBalancesForDelta = vi.fn()
    const ctx = {
      getCurrentData: vi.fn().mockReturnValue(mockPortfolioData),
      updateData: vi.fn(),
      updateWalletBalancesForDelta,
    }

    const updater = createPortfolioCacheUpdater(ctx)({ evmAddress: '0xuser', chainIds: [1, 2] })
    updater({ hidden: true })

    expect(updateWalletBalancesForDelta).not.toHaveBeenCalled()
  })

  it('does not invoke updateWalletBalancesForDelta when the GetPortfolio cache is empty', () => {
    const updateWalletBalancesForDelta = vi.fn()
    const ctx = {
      getCurrentData: vi.fn().mockReturnValue(undefined),
      updateData: vi.fn(),
      updateWalletBalancesForDelta,
    }

    const updater = createPortfolioCacheUpdater(ctx)({ evmAddress: '0xuser', chainIds: [1, 2] })
    updater({ hidden: true, portfolioBalance: mockPortfolioBalance1 })

    expect(updateWalletBalancesForDelta).not.toHaveBeenCalled()
  })
})

type WalletBalancesShape = {
  balance: {
    total: { valueUsd: number }
    tokens: { valueUsd: number }
    pools: { valueUsd: number }
  }
}

function makeWalletBalances(total: number, tokens: number, pools: number): GetWalletBalancesResponse {
  return {
    balance: {
      total: { valueUsd: total },
      tokens: { valueUsd: tokens },
      pools: { valueUsd: pools },
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
    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet] })
    mockUseRestPortfolioValueModifier.mockReturnValue(modifier)
  })

  afterEach(() => {
    SharedQueryClient.clear()
  })

  // The wallet-balances entry the header reads is keyed by `includeCategories`, so the optimistic
  // token-side write must carry the same categories the rendered query used. Prime that exact key.
  function primeCaches(includeCategories: WalletBalanceCategory[] = []): {
    portfolioKey: readonly unknown[]
    walletBalancesKey: readonly unknown[]
  } {
    const portfolioKey = getPortfolioQuery({ input: hookInput }).queryKey
    const walletBalancesKey = getWalletBalancesQuery({ input: { ...hookInput, includeCategories } }).queryKey
    SharedQueryClient.setQueryData(portfolioKey, mockPortfolioData as unknown as GetPortfolioResponse)
    SharedQueryClient.setQueryData(walletBalancesKey, makeWalletBalances(1000, 600, 400))
    return { portfolioKey, walletBalancesKey }
  }

  it('mutates both the GetPortfolio and GetWalletBalances caches when hiding a token', () => {
    const { portfolioKey, walletBalancesKey } = primeCaches()

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(true, mockPortfolioBalance1)

    const portfolioAfter = SharedQueryClient.getQueryData<typeof mockPortfolioData>(portfolioKey)
    expect(portfolioAfter?.portfolio.balances[0]?.isHidden).toBe(true)
    expect(portfolioAfter?.portfolio.totalValueUsd).toBe(200)

    const walletAfter = SharedQueryClient.getQueryData<WalletBalancesShape>(walletBalancesKey)
    expect(walletAfter?.balance.total.valueUsd).toBe(900)
    expect(walletAfter?.balance.tokens.valueUsd).toBe(500)
    expect(walletAfter?.balance.pools.valueUsd).toBe(400)
  })

  it('targets the pools-inclusive wallet balances cache entry when the pools flag is on', () => {
    mockPoolsFlagEnabled.value = true
    const { walletBalancesKey } = primeCaches([WalletBalanceCategory.POOLS])

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(true, mockPortfolioBalance1)

    const walletAfter = SharedQueryClient.getQueryData<WalletBalancesShape>(walletBalancesKey)
    expect(walletAfter?.balance.total.valueUsd).toBe(900)
    expect(walletAfter?.balance.tokens.valueUsd).toBe(500)
    expect(walletAfter?.balance.pools.valueUsd).toBe(400)
  })

  it('leaves a wallet balances entry keyed with a different includeCategories untouched', () => {
    mockPoolsFlagEnabled.value = true
    const { walletBalancesKey } = primeCaches([WalletBalanceCategory.POOLS])
    const tokensOnlyKey = getWalletBalancesQuery({ input: { ...hookInput, includeCategories: [] } }).queryKey
    SharedQueryClient.setQueryData(tokensOnlyKey, makeWalletBalances(2000, 1500, 500))

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(true, mockPortfolioBalance1)

    // The matching pools-inclusive entry is mutated.
    const targeted = SharedQueryClient.getQueryData<WalletBalancesShape>(walletBalancesKey)
    expect(targeted?.balance.total.valueUsd).toBe(900)
    expect(targeted?.balance.tokens.valueUsd).toBe(500)
    // The non-matching tokens-only entry is left as-is.
    const untouched = SharedQueryClient.getQueryData<WalletBalancesShape>(tokensOnlyKey)
    expect(untouched?.balance.total.valueUsd).toBe(2000)
    expect(untouched?.balance.tokens.valueUsd).toBe(1500)
    expect(untouched?.balance.pools.valueUsd).toBe(500)
  })

  it('mutates both caches in the opposite direction when un-hiding a token', () => {
    const { portfolioKey, walletBalancesKey } = primeCaches()

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(false, mockPortfolioBalance2)

    const portfolioAfter = SharedQueryClient.getQueryData<typeof mockPortfolioData>(portfolioKey)
    expect(portfolioAfter?.portfolio.totalValueUsd).toBe(500)

    const walletAfter = SharedQueryClient.getQueryData<WalletBalancesShape>(walletBalancesKey)
    expect(walletAfter?.balance.total.valueUsd).toBe(1200)
    expect(walletAfter?.balance.tokens.valueUsd).toBe(800)
    expect(walletAfter?.balance.pools.valueUsd).toBe(400)
  })

  it('is a no-op against both caches when no portfolioBalance is provided', () => {
    const { portfolioKey, walletBalancesKey } = primeCaches()

    const { result } = renderHookWithProviders(() => usePortfolioCacheUpdater(EVM_ADDR))

    result.current(true)

    expect(SharedQueryClient.getQueryData(portfolioKey)).toEqual(mockPortfolioData)
    const walletAfter = SharedQueryClient.getQueryData<WalletBalancesShape>(walletBalancesKey)
    expect(walletAfter?.balance.total.valueUsd).toBe(1000)
    expect(walletAfter?.balance.tokens.valueUsd).toBe(600)
    expect(walletAfter?.balance.pools.valueUsd).toBe(400)
  })
})
