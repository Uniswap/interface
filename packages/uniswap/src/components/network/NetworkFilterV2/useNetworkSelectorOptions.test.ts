import { useNetworkSelectorOptions } from 'uniswap/src/components/network/NetworkFilterV2/useNetworkSelectorOptions'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { renderHookWithProviders } from 'uniswap/src/test/render'

vi.mock('uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById')

function mockBalance(chainId: number, balanceUSD: number | null): PortfolioBalance {
  return {
    id: `${chainId}-${balanceUSD}`,
    cacheId: `${chainId}-${balanceUSD}`,
    quantity: 1,
    balanceUSD,
    currencyInfo: {
      currency: { chainId } as PortfolioBalance['currencyInfo']['currency'],
      currencyId: `${chainId}-token`,
    } as PortfolioBalance['currencyInfo'],
    relativeChange24: null,
    isHidden: false,
  }
}

function mockPortfolioData(balances: PortfolioBalance[]): Record<string, PortfolioBalance> {
  return Object.fromEntries(balances.map((b) => [b.id, b]))
}

const TEST_CHAINS = [
  UniverseChainId.Mainnet,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Base,
  UniverseChainId.Optimism,
  UniverseChainId.Polygon,
  UniverseChainId.Zora,
]

const CONNECTED_ADDRESSES = { evmAddress: '0x123' as `0x${string}` }
const EMPTY_ADDRESSES = {}

function setupMock(data: Record<string, PortfolioBalance> | undefined): void {
  vi.mocked(usePortfolioBalancesForAddressById).mockReturnValue({
    data,
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  })
}

describe('useNetworkSelectorOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sorts withBalances by USD descending', () => {
    setupMock(
      mockPortfolioData([
        mockBalance(UniverseChainId.Base, 500),
        mockBalance(UniverseChainId.Mainnet, 1200),
        mockBalance(UniverseChainId.ArbitrumOne, 50),
      ]),
    )

    const { result } = renderHookWithProviders(() =>
      useNetworkSelectorOptions({
        addresses: CONNECTED_ADDRESSES,
        chainIds: TEST_CHAINS,
      }),
    )

    expect(result.current?.withBalances.map((o) => o.chainId)).toEqual([
      UniverseChainId.Mainnet,
      UniverseChainId.Base,
      UniverseChainId.ArbitrumOne,
    ])
    expect(result.current?.withBalances[0]?.balanceUSD).toBe(1200)
    expect(result.current?.withBalances[1]?.balanceUSD).toBe(500)
    expect(result.current?.withBalances[2]?.balanceUSD).toBe(50)
  })

  it('preserves input chainIds order for otherNetworks', () => {
    setupMock(mockPortfolioData([mockBalance(UniverseChainId.Mainnet, 100)]))

    const { result } = renderHookWithProviders(() =>
      useNetworkSelectorOptions({
        addresses: CONNECTED_ADDRESSES,
        chainIds: TEST_CHAINS,
      }),
    )

    // otherNetworks should match the order of TEST_CHAINS minus the chain with balance (Mainnet)
    const expectedOrder = TEST_CHAINS.filter((c) => c !== UniverseChainId.Mainnet)
    expect(result.current?.otherNetworks.map((o) => o.chainId)).toEqual(expectedOrder)
  })

  it('returns undefined when wallet is disconnected', () => {
    setupMock(undefined)

    const { result } = renderHookWithProviders(() =>
      useNetworkSelectorOptions({
        addresses: EMPTY_ADDRESSES,
        chainIds: TEST_CHAINS,
      }),
    )

    expect(result.current).toBeUndefined()
  })

  it('returns undefined when enabled is false', () => {
    setupMock(mockPortfolioData([mockBalance(UniverseChainId.Mainnet, 1000)]))

    const { result } = renderHookWithProviders(() =>
      useNetworkSelectorOptions({
        addresses: CONNECTED_ADDRESSES,
        chainIds: TEST_CHAINS,
        enabled: false,
      }),
    )

    expect(result.current).toBeUndefined()
  })

  it('partitions chains correctly between withBalances and otherNetworks', () => {
    setupMock(mockPortfolioData([mockBalance(UniverseChainId.Mainnet, 500), mockBalance(UniverseChainId.Base, 200)]))

    const { result } = renderHookWithProviders(() =>
      useNetworkSelectorOptions({
        addresses: CONNECTED_ADDRESSES,
        chainIds: TEST_CHAINS,
      }),
    )

    const withBalanceIds = result.current?.withBalances.map((o) => o.chainId)
    const otherIds = result.current?.otherNetworks.map((o) => o.chainId)

    expect(withBalanceIds).toContain(UniverseChainId.Mainnet)
    expect(withBalanceIds).toContain(UniverseChainId.Base)
    expect(otherIds).not.toContain(UniverseChainId.Mainnet)
    expect(otherIds).not.toContain(UniverseChainId.Base)
    expect((withBalanceIds?.length ?? 0) + (otherIds?.length ?? 0)).toBe(TEST_CHAINS.length)
  })

  it('puts zero-balance chains in otherNetworks', () => {
    setupMock(mockPortfolioData([mockBalance(UniverseChainId.Mainnet, 0), mockBalance(UniverseChainId.Base, 100)]))

    const { result } = renderHookWithProviders(() =>
      useNetworkSelectorOptions({
        addresses: CONNECTED_ADDRESSES,
        chainIds: TEST_CHAINS,
      }),
    )

    const withBalanceIds = result.current?.withBalances.map((o) => o.chainId)
    const otherIds = result.current?.otherNetworks.map((o) => o.chainId)

    expect(withBalanceIds).not.toContain(UniverseChainId.Mainnet)
    expect(otherIds).toContain(UniverseChainId.Mainnet)
    expect(withBalanceIds).toContain(UniverseChainId.Base)
  })

  it('aggregates multiple token balances on the same chain', () => {
    setupMock(
      mockPortfolioData([
        mockBalance(UniverseChainId.Mainnet, 300),
        { ...mockBalance(UniverseChainId.Mainnet, 200), id: 'eth-token-2', cacheId: 'eth-token-2' },
      ]),
    )

    const { result } = renderHookWithProviders(() =>
      useNetworkSelectorOptions({
        addresses: CONNECTED_ADDRESSES,
        chainIds: TEST_CHAINS,
      }),
    )

    const ethOption = result.current?.withBalances.find((o) => o.chainId === UniverseChainId.Mainnet)
    expect(ethOption?.balanceUSD).toBe(500)
  })

  it('excludes spam tokens from balance aggregation', () => {
    setupMock(
      mockPortfolioData([
        {
          ...mockBalance(UniverseChainId.Mainnet, 500),
          currencyInfo: {
            ...mockBalance(UniverseChainId.Mainnet, 500).currencyInfo,
            isSpam: true,
          } as PortfolioBalance['currencyInfo'],
        },
      ]),
    )

    const { result } = renderHookWithProviders(() =>
      useNetworkSelectorOptions({
        addresses: CONNECTED_ADDRESSES,
        chainIds: TEST_CHAINS,
      }),
    )

    expect(result.current?.withBalances.map((o) => o.chainId)).not.toContain(UniverseChainId.Mainnet)
    expect(result.current?.otherNetworks.map((o) => o.chainId)).toContain(UniverseChainId.Mainnet)
  })

  it('excludes hidden tokens from balance aggregation', () => {
    setupMock(mockPortfolioData([{ ...mockBalance(UniverseChainId.Mainnet, 500), isHidden: true }]))

    const { result } = renderHookWithProviders(() =>
      useNetworkSelectorOptions({
        addresses: CONNECTED_ADDRESSES,
        chainIds: TEST_CHAINS,
      }),
    )

    expect(result.current?.withBalances.map((o) => o.chainId)).not.toContain(UniverseChainId.Mainnet)
    expect(result.current?.otherNetworks.map((o) => o.chainId)).toContain(UniverseChainId.Mainnet)
  })

  it('coalesces null balanceUSD to 0', () => {
    setupMock(mockPortfolioData([mockBalance(UniverseChainId.Mainnet, null)]))

    const { result } = renderHookWithProviders(() =>
      useNetworkSelectorOptions({
        addresses: CONNECTED_ADDRESSES,
        chainIds: TEST_CHAINS,
      }),
    )

    const otherIds = result.current?.otherNetworks.map((o) => o.chainId)
    expect(otherIds).toContain(UniverseChainId.Mainnet)
    expect(result.current?.withBalances.map((o) => o.chainId)).not.toContain(UniverseChainId.Mainnet)
  })
})
