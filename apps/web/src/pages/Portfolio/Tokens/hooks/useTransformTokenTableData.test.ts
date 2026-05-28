import { NetworkStatus } from '@apollo/client'
import { GetWalletTokensProfitLossResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { Token } from '@uniswap/sdk-core'
import { USDC_ARBITRUM, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type {
  CurrencyInfo,
  PortfolioChainBalance,
  PortfolioMultichainBalance,
} from 'uniswap/src/features/dataApi/types'
import { useSortedPortfolioBalancesMultichain } from 'uniswap/src/features/portfolio/balances/hooks'
import {
  createPortfolioChainBalance,
  createPortfolioMultichainBalance,
} from 'uniswap/src/test/fixtures/dataApi/portfolioMultichainBalances'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { describe, expect, it, vi } from 'vitest'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { useTransformTokenTableData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import {
  TEST_TOKEN_1,
  TEST_TOKEN_1_INFO,
  TEST_TOKEN_2_INFO,
  USDC_ARBITRUM_INFO,
  USDC_INFO,
} from '~/test-utils/constants'
import { renderHook } from '~/test-utils/render'
import { assume0xAddress } from '~/utils/wagmi'

vi.mock('~/pages/Portfolio/hooks/usePortfolioAddresses', () => ({
  usePortfolioAddresses: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal()),
  useFeatureFlag: vi.fn().mockReturnValue(false),
  FeatureFlags: { MultichainTokenUx: 'multichain_token_ux' },
}))

vi.mock('uniswap/src/features/portfolio/balances/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/portfolio/balances/hooks')>()
  return {
    ...actual,
    useSortedPortfolioBalancesMultichain: vi.fn(),
  }
})

const mockUsePortfolioAddresses = vi.mocked(usePortfolioAddresses)
const mockUseSortedPortfolioBalancesMultichain = vi.mocked(useSortedPortfolioBalancesMultichain)

/** Web-only preset around shared {@link createPortfolioChainBalance} (quantity/valueUsd for token table tests). */
function createPortfolioTableChainBalance(
  currencyInfo: CurrencyInfo,
  overrides: Partial<PortfolioChainBalance> = {},
): PortfolioChainBalance {
  const c = currencyInfo.currency
  const address = c instanceof Token ? c.address : '0x0000000000000000000000000000000000000001'
  return createPortfolioChainBalance({
    chainId: c.chainId,
    address,
    decimals: c.decimals,
    quantity: 100,
    valueUsd: 1000,
    isHidden: false,
    currencyInfo,
    ...overrides,
  })
}

/** Web-only preset around shared {@link createPortfolioMultichainBalance}. */
function createPortfolioTableMultichainBalance(
  currencyInfo: CurrencyInfo,
  overrides: Partial<PortfolioMultichainBalance> = {},
): PortfolioMultichainBalance {
  return createPortfolioMultichainBalance(
    {
      name: 'Test Token',
      symbol: 'TEST',
      logoUrl: null,
      totalAmount: 100,
      priceUsd: 10,
      pricePercentChange1d: null,
      totalValueUsd: 1000,
      isHidden: false,
      tokens: [createPortfolioTableChainBalance(currencyInfo)],
      ...overrides,
    },
    { cacheOwnerSuffix: '0xowner' },
  )
}

const createChainBalance = (overrides: Partial<PortfolioChainBalance> = {}): PortfolioChainBalance =>
  createPortfolioTableChainBalance(TEST_TOKEN_1_INFO, overrides)

const createMultichainBalance = (overrides: Partial<PortfolioMultichainBalance> = {}): PortfolioMultichainBalance =>
  createPortfolioTableMultichainBalance(TEST_TOKEN_1_INFO, overrides)

describe('useTransformTokenTableData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePortfolioAddresses.mockReturnValue({
      evmAddress: assume0xAddress('0xowner'),
      svmAddress: undefined,
      isExternalWallet: false,
    })
    mockUseSortedPortfolioBalancesMultichain.mockReturnValue({
      data: undefined,
      balancesById: undefined,
      loading: false,
      error: undefined,
      refetch: undefined,
      networkStatus: NetworkStatus.ready,
    } as ReturnType<typeof useSortedPortfolioBalancesMultichain>)
  })

  it('returns empty visible and hidden when no sorted balances', () => {
    mockUseSortedPortfolioBalancesMultichain.mockReturnValue({
      data: undefined,
      balancesById: undefined,
      loading: false,
      error: undefined,
      refetch: undefined,
      networkStatus: NetworkStatus.ready,
    } as ReturnType<typeof useSortedPortfolioBalancesMultichain>)

    const { result } = renderHook(() => useTransformTokenTableData({}))

    expect(result.current.visible).toEqual([])
    expect(result.current.hidden).toEqual([])
    expect(result.current.totalCount).toBe(0)
  })

  it('filters out balances with no tokens from visible', () => {
    const balanceWithTokens = createMultichainBalance({
      id: 'with-tokens',
      tokens: [createChainBalance()],
    })
    const balanceWithNoTokens = createMultichainBalance({
      id: 'no-tokens',
      tokens: [],
    })

    mockUseSortedPortfolioBalancesMultichain.mockReturnValue({
      data: {
        balances: [balanceWithTokens, balanceWithNoTokens],
        hiddenBalances: [],
      },
      balancesById: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      networkStatus: NetworkStatus.ready,
    } as ReturnType<typeof useSortedPortfolioBalancesMultichain>)

    const { result } = renderHook(() => useTransformTokenTableData({}))

    expect(result.current.visible).not.toBeNull()
    expect(result.current.visible).toHaveLength(1)
    expect(result.current.visible![0].id).toBe('with-tokens')
    expect(result.current.visible![0].tokens).toHaveLength(1)
  })

  it('filters out balances with no tokens from hidden', () => {
    const hiddenWithTokens = createMultichainBalance({
      id: 'hidden-with-tokens',
      tokens: [createChainBalance()],
    })
    const hiddenWithNoTokens = createMultichainBalance({
      id: 'hidden-no-tokens',
      tokens: [],
    })

    mockUseSortedPortfolioBalancesMultichain.mockReturnValue({
      data: {
        balances: [],
        hiddenBalances: [hiddenWithTokens, hiddenWithNoTokens],
      },
      balancesById: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      networkStatus: NetworkStatus.ready,
    } as ReturnType<typeof useSortedPortfolioBalancesMultichain>)

    const { result } = renderHook(() => useTransformTokenTableData({}))

    expect(result.current.hidden).not.toBeNull()
    expect(result.current.hidden).toHaveLength(1)
    expect(result.current.hidden![0].id).toBe('hidden-with-tokens')
    expect(result.current.hidden![0].tokens).toHaveLength(1)
    expect(result.current.hidden![0].isMultichainAsset).toBe(false)
  })

  it('flattens fully hidden multichain balances to one TokenData row per chain before table mapping', () => {
    const t1 = createPortfolioTableChainBalance(TEST_TOKEN_1_INFO, {
      chainId: UniverseChainId.Mainnet,
      quantity: 2,
      valueUsd: 10,
    })
    const t2 = createPortfolioTableChainBalance(TEST_TOKEN_2_INFO, {
      chainId: UniverseChainId.ArbitrumOne,
      quantity: 0,
      valueUsd: 0,
    })
    const hiddenMulti = createMultichainBalance({
      id: 'hidden-multi',
      priceUsd: 5,
      tokens: [t1, t2],
    })

    mockUseSortedPortfolioBalancesMultichain.mockReturnValue({
      data: {
        balances: [],
        hiddenBalances: [hiddenMulti],
      },
      balancesById: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      networkStatus: NetworkStatus.ready,
    } as ReturnType<typeof useSortedPortfolioBalancesMultichain>)

    const { result } = renderHook(() => useTransformTokenTableData({}))

    expect(result.current.hidden).not.toBeNull()
    expect(result.current.hidden).toHaveLength(2)
    for (const row of result.current.hidden!) {
      expect(row.tokens).toHaveLength(1)
    }

    const suffix1 = currencyId(TEST_TOKEN_1_INFO.currency)!
    expect(result.current.hidden![0]).toMatchObject({
      id: `hidden-multi-${suffix1}`,
      testId: `${TestID.TokenTableRowPrefix}hidden-multi-${suffix1}`,
      chainId: UniverseChainId.Mainnet,
      quantity: 2,
      price: 5,
      totalValue: 10,
      isMultichainAsset: true,
    })
    expect(result.current.hidden![0]!.tokens[0]).toMatchObject({
      chainId: UniverseChainId.Mainnet,
      quantity: 2,
      valueUsd: 10,
      currencyInfo: TEST_TOKEN_1_INFO,
    })
    expect(result.current.hidden![1]).toMatchObject({
      chainId: UniverseChainId.ArbitrumOne,
      price: 5,
      isMultichainAsset: true,
    })
    expect(result.current.hidden![1]!.tokens[0]).toMatchObject({
      chainId: UniverseChainId.ArbitrumOne,
      currencyInfo: TEST_TOKEN_2_INFO,
    })
  })

  it('omits unrealized P/L on per-chain token entries when the asset is a stablecoin', () => {
    const mainnetUsdc = createPortfolioTableChainBalance(USDC_INFO, {
      chainId: UniverseChainId.Mainnet,
      quantity: 100,
      valueUsd: 2000,
    })
    const arbitrumUsdc = createPortfolioTableChainBalance(USDC_ARBITRUM_INFO, {
      chainId: UniverseChainId.ArbitrumOne,
      quantity: 50,
      valueUsd: 1000,
    })
    const usdcMultichain = createMultichainBalance({
      id: 'usdc-multi',
      name: 'USD Coin',
      symbol: 'USDC',
      tokens: [mainnetUsdc, arbitrumUsdc],
    })

    const tokenProfitLossData = {
      tokenProfitLosses: [
        {
          token: {
            address: USDC_MAINNET.address,
            chainId: UniverseChainId.Mainnet,
          },
          averageCostUsd: 1,
          unrealizedReturnUsd: 12.34,
          unrealizedReturnPercent: 0.05,
        },
        {
          token: {
            address: USDC_ARBITRUM.address,
            chainId: UniverseChainId.ArbitrumOne,
          },
          averageCostUsd: 1,
          unrealizedReturnUsd: 56.78,
          unrealizedReturnPercent: 0.06,
        },
      ],
      multichainTokenProfitLoss: [],
    } as unknown as GetWalletTokensProfitLossResponse

    mockUseSortedPortfolioBalancesMultichain.mockReturnValue({
      data: {
        balances: [usdcMultichain],
        hiddenBalances: [],
      },
      balancesById: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      networkStatus: NetworkStatus.ready,
    } as ReturnType<typeof useSortedPortfolioBalancesMultichain>)

    const { result } = renderHook(() =>
      useTransformTokenTableData({
        tokenProfitLossData,
      }),
    )

    expect(result.current.visible).not.toBeNull()
    expect(result.current.visible).toHaveLength(1)
    const row = result.current.visible![0]
    expect(row.isMultichainAsset).toBe(true)
    expect(row.tokens).toHaveLength(2)
    for (const chainToken of row.tokens) {
      expect(chainToken.avgCost).toBe(1)
      expect(chainToken.unrealizedPnl).toBeUndefined()
      expect(chainToken.unrealizedPnlPercent).toBeUndefined()
    }
  })

  it('uses multichain aggregated PnL on the parent row when multichainTokenProfitLoss includes aggregated', () => {
    const mainT = createPortfolioTableChainBalance(TEST_TOKEN_1_INFO, {
      chainId: UniverseChainId.Mainnet,
      valueUsd: 3000,
    })
    const arbT = createPortfolioTableChainBalance(TEST_TOKEN_1_INFO, {
      chainId: UniverseChainId.ArbitrumOne,
      valueUsd: 1000,
    })
    const multi = createMultichainBalance({
      id: 'mc-agg-pnl',
      tokens: [mainT, arbT],
    })

    const tokenProfitLossData = {
      tokenProfitLosses: [],
      multichainTokenProfitLoss: [
        {
          aggregated: {
            averageCostUsd: 7.43,
            unrealizedReturnUsd: -41785.75,
            unrealizedReturnPercent: -56.14,
            token: { address: TEST_TOKEN_1.address, chainId: UniverseChainId.Mainnet },
          },
          chainBreakdown: [
            {
              tokenAddress: TEST_TOKEN_1.address,
              chainId: UniverseChainId.Mainnet,
              averageCostUsd: 10,
              unrealizedReturnUsd: -100,
              unrealizedReturnPercent: -10,
            },
            {
              tokenAddress: TEST_TOKEN_1.address,
              chainId: UniverseChainId.ArbitrumOne,
              averageCostUsd: 20,
              unrealizedReturnUsd: -200,
              unrealizedReturnPercent: -20,
            },
          ],
        },
      ],
    } as unknown as GetWalletTokensProfitLossResponse

    mockUseSortedPortfolioBalancesMultichain.mockReturnValue({
      data: {
        balances: [multi],
        hiddenBalances: [],
      },
      balancesById: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      networkStatus: NetworkStatus.ready,
    } as ReturnType<typeof useSortedPortfolioBalancesMultichain>)

    const { result } = renderHook(() =>
      useTransformTokenTableData({
        tokenProfitLossData,
      }),
    )

    expect(result.current.visible).not.toBeNull()
    expect(result.current.visible).toHaveLength(1)
    const row = result.current.visible![0]
    expect(row.isMultichainAsset).toBe(true)
    expect(row.avgCost).toBe(7.43)
    expect(row.unrealizedPnl).toBe(-41785.75)
    expect(row.unrealizedPnlPercent).toBe(-56.14)

    const mainChainToken = row.tokens.find((t) => t.chainId === UniverseChainId.Mainnet)
    const arbChainToken = row.tokens.find((t) => t.chainId === UniverseChainId.ArbitrumOne)
    expect(mainChainToken?.avgCost).toBe(10)
    expect(mainChainToken?.unrealizedPnl).toBe(-100)
    expect(mainChainToken?.unrealizedPnlPercent).toBe(-10)
    expect(arbChainToken?.avgCost).toBe(20)
    expect(arbChainToken?.unrealizedPnl).toBe(-200)
    expect(arbChainToken?.unrealizedPnlPercent).toBe(-20)
  })

  it('uses aggregated PnL when chainBreakdown is empty but aggregated.token matches the row leg', () => {
    const mainT = createPortfolioTableChainBalance(TEST_TOKEN_1_INFO, {
      chainId: UniverseChainId.Mainnet,
    })
    const single = createMultichainBalance({ id: 'single-agg-no-breakdown', tokens: [mainT] })

    const tokenProfitLossData = {
      tokenProfitLosses: [],
      multichainTokenProfitLoss: [
        {
          aggregated: {
            averageCostUsd: 5,
            unrealizedReturnUsd: 99,
            unrealizedReturnPercent: 0.25,
            token: { address: TEST_TOKEN_1.address, chainId: UniverseChainId.Mainnet },
          },
          chainBreakdown: [],
        },
      ],
    } as unknown as GetWalletTokensProfitLossResponse

    mockUseSortedPortfolioBalancesMultichain.mockReturnValue({
      data: {
        balances: [single],
        hiddenBalances: [],
      },
      balancesById: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      networkStatus: NetworkStatus.ready,
    } as ReturnType<typeof useSortedPortfolioBalancesMultichain>)

    const { result } = renderHook(() =>
      useTransformTokenTableData({
        tokenProfitLossData,
      }),
    )

    expect(result.current.visible).not.toBeNull()
    const row = result.current.visible![0]
    expect(row.avgCost).toBe(5)
    expect(row.unrealizedPnl).toBe(99)
    expect(row.unrealizedPnlPercent).toBe(0.25)
    expect(row.tokens).toHaveLength(1)
    expect(row.tokens[0].avgCost).toBeUndefined()
    expect(row.tokens[0].unrealizedPnl).toBeUndefined()
  })

  it('every visible and hidden entry has tokens.length >= 1', () => {
    const balance1 = createMultichainBalance({ id: 'balance-1', tokens: [createChainBalance()] })
    const balance2 = createMultichainBalance({
      id: 'balance-2',
      tokens: [createChainBalance(), createChainBalance({ chainId: 42161 })],
    })

    mockUseSortedPortfolioBalancesMultichain.mockReturnValue({
      data: {
        balances: [balance1, balance2],
        hiddenBalances: [],
      },
      balancesById: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      networkStatus: NetworkStatus.ready,
    } as ReturnType<typeof useSortedPortfolioBalancesMultichain>)

    const { result } = renderHook(() => useTransformTokenTableData({}))

    expect(result.current.visible).not.toBeNull()
    for (const row of result.current.visible!) {
      expect(row.tokens.length).toBeGreaterThanOrEqual(1)
      expect(row.tokens[0]).toBeDefined()
    }

    expect(result.current.hidden).not.toBeNull()
    for (const row of result.current.hidden!) {
      expect(row.tokens.length).toBeGreaterThanOrEqual(1)
      expect(row.tokens[0]).toBeDefined()
    }
  })
})
