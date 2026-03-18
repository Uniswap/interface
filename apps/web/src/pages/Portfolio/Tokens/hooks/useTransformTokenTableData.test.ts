import { NetworkStatus } from '@apollo/client'
import { useSortedPortfolioBalancesMultichain } from 'uniswap/src/features/dataApi/balances/balances'
import type { PortfolioChainBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import { describe, expect, it, vi } from 'vitest'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { useTransformTokenTableData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TEST_TOKEN_1_INFO } from '~/test-utils/constants'
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

vi.mock('uniswap/src/features/dataApi/balances/balances', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/dataApi/balances/balances')>()
  return {
    ...actual,
    useSortedPortfolioBalancesMultichain: vi.fn(),
  }
})

const mockUsePortfolioAddresses = vi.mocked(usePortfolioAddresses)
const mockUseSortedPortfolioBalancesMultichain = vi.mocked(useSortedPortfolioBalancesMultichain)

function createChainBalance(overrides: Partial<PortfolioChainBalance> = {}): PortfolioChainBalance {
  return {
    chainId: 1,
    address: '0x0000000000000000000000000000000000000001',
    decimals: 18,
    quantity: 100,
    valueUsd: 1000,
    currencyInfo: TEST_TOKEN_1_INFO,
    ...overrides,
  }
}

function createMultichainBalance(
  overrides: Partial<{ id?: string; tokens: PortfolioChainBalance[] }> & Partial<PortfolioMultichainBalance> = {},
): PortfolioMultichainBalance {
  const tokens = overrides.tokens ?? [createChainBalance()]
  const id = overrides.id ?? tokens[0].currencyInfo.currencyId
  return {
    id,
    cacheId: `TokenBalance:${id}-0xowner`,
    name: 'Test Token',
    symbol: 'TEST',
    logoUrl: null,
    totalAmount: 100,
    priceUsd: 10,
    pricePercentChange1d: null,
    totalValueUsd: 1000,
    isHidden: false,
    tokens,
    ...overrides,
  }
}

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
      loading: false,
      error: undefined,
      refetch: undefined,
      networkStatus: NetworkStatus.ready,
    } as ReturnType<typeof useSortedPortfolioBalancesMultichain>)
  })

  it('returns empty visible and hidden when no sorted balances', () => {
    mockUseSortedPortfolioBalancesMultichain.mockReturnValue({
      data: undefined,
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
