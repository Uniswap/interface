import { Token as DataApiToken, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  EarnPosition as DataApiEarnPosition,
  EarnVault as DataApiEarnVault,
} from '@uniswap/client-data-api/dist/data/v2/earn_pb'
import { getDynamicConfigValue } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEarnVaultId } from 'uniswap/src/features/earn/utils'
import { EarnEventName } from 'uniswap/src/features/telemetry/constants/features'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { PortfolioEarnSection } from './PortfolioEarnSection'
import { fireEvent, render, screen } from '~/test-utils/render'

const ACCOUNT = '0x0000000000000000000000000000000000000001'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const USDC_VAULT_ADDRESS = '0x1111111111111111111111111111111111111111'
const DAI_VAULT_ADDRESS = '0x2222222222222222222222222222222222222222'
const WETH_VAULT_ADDRESS = '0x3333333333333333333333333333333333333333'

const mockUseQuery = vi.hoisted(() => vi.fn())
const mockUseQueries = vi.hoisted(() => vi.fn())
const mockUsePortfolioBalances = vi.hoisted(() => vi.fn())
const mockUseTokenProjectsByCurrencyId = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()

  return {
    ...actual,
    useQuery: mockUseQuery,
    useQueries: mockUseQueries,
  }
})

vi.mock('uniswap/src/features/portfolio/balances/hooks', () => ({
  usePortfolioBalances: mockUsePortfolioBalances,
}))

vi.mock('uniswap/src/features/dataApi/tokenProjects/tokenProjects', () => ({
  useTokenProjectsByCurrencyId: mockUseTokenProjectsByCurrencyId,
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    convertFiatAmountFormatted: (value: number | string) =>
      `$${Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    formatCurrencyAmount: ({ value }: { value: { toExact: () => string } }) =>
      Number(value.toExact()).toLocaleString('en-US', {
        maximumFractionDigits: 6,
      }),
    formatPercent: (value: number) => `${value.toFixed(2)}%`,
  }),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', async () => {
  const { Token } = await import('@uniswap/sdk-core')
  const { nativeOnChain } = await import('uniswap/src/constants/tokens')
  const { buildCurrencyId, buildNativeCurrencyId, buildWrappedNativeCurrencyIdWithThrow } =
    await import('uniswap/src/utils/currencyId')
  const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  const daiCurrencyId = buildCurrencyId(1, daiAddress)
  const ethCurrencyId = buildNativeCurrencyId(1)
  const wethCurrencyId = buildWrappedNativeCurrencyIdWithThrow(1)

  return {
    useCurrencyInfo: (currencyId: string | undefined) => {
      if (currencyId === ethCurrencyId) {
        return {
          currency: nativeOnChain(1),
          currencyId,
          logoUrl: undefined,
        }
      }

      const isDai = currencyId === daiCurrencyId
      const isWeth = currencyId === wethCurrencyId
      const address = isDai ? daiAddress : isWeth ? wethAddress : usdcAddress
      const symbol = isDai ? 'DAI' : isWeth ? 'WETH' : 'USDC'
      const name = isDai ? 'DAI' : isWeth ? 'Wrapped Ether' : 'USDC'
      const decimals = isDai || isWeth ? 18 : 6

      return {
        currency: new Token(1, address, decimals, symbol, name),
        currencyId,
        logoUrl: undefined,
      }
    },
  }
})

vi.mock('~/features/earn/EarnVaultModal', () => ({
  EarnVaultModal: ({
    initialView,
    isOpen,
    vault,
  }: {
    initialView?: string
    isOpen: boolean
    vault?: { id?: string } | null
  }) => (
    <div
      data-testid="earn-vault-modal"
      data-open={String(isOpen)}
      data-initial-view={initialView ?? ''}
      data-vault-id={vault?.id ?? ''}
    />
  ),
}))

function createVault({
  address,
  decimals,
  symbol,
  vaultAddress,
}: {
  address: string
  decimals: number
  symbol: string
  vaultAddress: string
}): DataApiEarnVault {
  return new DataApiEarnVault({
    address: vaultAddress,
    chainId: UniverseChainId.Mainnet,
    name: `${symbol} Vault`,
    symbol: `gt${symbol}`,
    underlyingToken: new DataApiToken({
      chainId: UniverseChainId.Mainnet,
      address,
      decimals,
      name: symbol,
      symbol,
      type: TokenType.ERC20,
    }),
    netApy: 0.0523,
  })
}

const mockRefetch = vi.hoisted(() => vi.fn(() => Promise.resolve()))

function mockEarnQueries({
  positions,
  vaults,
  positionsLoading = false,
  vaultsLoading = false,
  vaultsError = false,
  positionsError = false,
  lifetimeEarningsError = false,
  lifetimePnlByVaultAddress = {},
}: {
  positions: DataApiEarnPosition[]
  vaults: DataApiEarnVault[]
  positionsLoading?: boolean
  vaultsLoading?: boolean
  vaultsError?: boolean
  positionsError?: boolean
  lifetimeEarningsError?: boolean
  lifetimePnlByVaultAddress?: Record<string, number>
}): void {
  mockUseQuery.mockImplementation(
    ({ queryKey, select }: { queryKey?: readonly unknown[]; select?: (data: unknown) => unknown }) => {
      switch (queryKey?.[1]) {
        case 'listEarnVaults': {
          const data = { vaults }
          return {
            data: (vaultsLoading || vaultsError) && !vaults.length ? undefined : select ? select(data) : data,
            isError: vaultsError,
            isLoading: vaultsLoading,
            isSuccess: !vaultsLoading && !vaultsError,
            refetch: mockRefetch,
          }
        }
        case 'listEarnPositions': {
          const data = { positions }
          return {
            data: (positionsLoading || positionsError) && !positions.length ? undefined : select ? select(data) : data,
            isError: positionsError,
            isLoading: positionsLoading,
            isSuccess: !positionsLoading && !positionsError,
            refetch: mockRefetch,
          }
        }
        default:
          return {
            data: undefined,
            isError: false,
            isLoading: false,
            isSuccess: false,
          }
      }
    },
  )

  // Match the hook's shape: per-query `select` strips to lifetimePnlUsd, then `combine` aggregates.
  mockUseQueries.mockImplementation(
    ({
      queries,
      combine,
    }: {
      queries: {
        queryKey?: readonly unknown[]
        select?: (data: unknown) => unknown
      }[]
      combine?: (
        results: {
          data: unknown
          isError: boolean
          isLoading: boolean
          isSuccess: boolean
          refetch: () => void
        }[],
      ) => unknown
    }) => {
      const results = queries.map((query) => {
        const params = query.queryKey?.[2] as { vaultAddress?: string } | undefined
        const lifetimePnlUsd = params?.vaultAddress ? lifetimePnlByVaultAddress[params.vaultAddress] : undefined
        const data = { position: { lifetimePnlUsd } }
        return {
          data: query.select ? query.select(data) : data,
          isError: lifetimeEarningsError,
          isLoading: false,
          isSuccess: !lifetimeEarningsError,
          refetch: mockRefetch,
        }
      })
      return combine ? combine(results) : results
    },
  )
}

const USDC_VAULT = createVault({
  address: USDC_ADDRESS,
  decimals: 6,
  symbol: 'USDC',
  vaultAddress: USDC_VAULT_ADDRESS,
})
const DAI_VAULT = createVault({
  address: DAI_ADDRESS,
  decimals: 18,
  symbol: 'DAI',
  vaultAddress: DAI_VAULT_ADDRESS,
})
const WETH_VAULT = createVault({
  address: WETH_ADDRESS,
  decimals: 18,
  symbol: 'WETH',
  vaultAddress: WETH_VAULT_ADDRESS,
})
const USDC_CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS)
const DAI_CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS)
const mockSendAnalyticsEvent = vi.mocked(sendAnalyticsEvent)

function mockPortfolioBalances(
  currencyIds: readonly string[],
  options?: { dataUpdatedAt?: number; error?: Error; loading?: boolean },
): void {
  mockUsePortfolioBalances.mockReturnValue({
    data: Object.fromEntries(currencyIds.map((currencyId) => [currencyId, createPortfolioBalance(currencyId)])),
    dataUpdatedAt: options?.dataUpdatedAt,
    error: options?.error,
    loading: options?.loading,
  })
}

function mockPortfolioBalancesError(): void {
  mockUsePortfolioBalances.mockReturnValue({
    data: undefined,
    dataUpdatedAt: undefined,
    error: new Error('Portfolio balance lookup failed'),
    loading: false,
  })
}

function createPortfolioBalance(currencyId: string) {
  return {
    balanceUSD: 100,
    currencyInfo: {
      currency: {
        chainId: UniverseChainId.Mainnet,
      },
      currencyId,
    },
    quantity: 100,
    quantityRaw: '1000000',
  }
}

describe('PortfolioEarnSection', () => {
  beforeEach(() => {
    vi.mocked(getDynamicConfigValue).mockImplementation(({ defaultValue }) => defaultValue)
    mockUseQuery.mockReset()
    mockUseQueries.mockReset()
    mockRefetch.mockClear()
    mockSendAnalyticsEvent.mockClear()
    mockUsePortfolioBalances.mockReset()
    mockUseTokenProjectsByCurrencyId.mockReset()
    mockPortfolioBalances([])
    mockUseTokenProjectsByCurrencyId.mockReturnValue({
      data: new Map(),
      error: undefined,
      loading: false,
      refetch: vi.fn(),
    })
  })

  it('renders aggregate deposits and opens the vault overview when a row with a position is pressed', () => {
    mockPortfolioBalances([DAI_CURRENCY_ID])
    mockEarnQueries({
      vaults: [DAI_VAULT, USDC_VAULT],
      positions: [
        new DataApiEarnPosition({
          vault: USDC_VAULT,
          sharesRaw: '1000000',
          currentAssetsRaw: '1000000000',
          currentAssetsUsd: 1000,
        }),
      ],
    })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.getByTestId(TestID.PortfolioOverviewEarnSection)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.PortfolioOverviewEarnTotalDeposited)).toHaveTextContent('$1,000.00')
    expect(screen.getByTestId(TestID.PortfolioOverviewEarnLifetimeEarnings)).toHaveTextContent('$0.00')
    expect(screen.getByText('Lifetime earnings')).toBeInTheDocument()
    expect(screen.getByText('1,000 USDC')).toBeInTheDocument()
    expect(screen.getByText('Deposit')).toBeInTheDocument()

    fireEvent.click(screen.getByText('USDC'))

    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-initial-view', 'vault')
    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute(
      'data-vault-id',
      getEarnVaultId({
        chainId: UniverseChainId.Mainnet,
        vaultAddress: USDC_VAULT_ADDRESS,
      }),
    )
  })

  it('renders wrapped-native vault positions as ETH', () => {
    mockEarnQueries({
      vaults: [WETH_VAULT],
      positions: [
        new DataApiEarnPosition({
          vault: WETH_VAULT,
          sharesRaw: '1000000000000000000',
          currentAssetsRaw: '1000000000000000000',
          currentAssetsUsd: 3000,
        }),
      ],
    })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.getAllByText('ETH').length).toBeGreaterThan(0)
    expect(screen.getByText('1 ETH')).toBeInTheDocument()
    expect(screen.queryByText('WETH')).toBeNull()
  })

  it('renders nothing when there are no vaults and queries are settled', () => {
    mockEarnQueries({ vaults: [], positions: [] })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.queryByTestId(TestID.PortfolioOverviewEarnSection)).toBeNull()
  })

  it('renders the error state with a working retry when a query fails and there is no data', () => {
    mockEarnQueries({ vaults: [], positions: [], vaultsError: true })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.getByTestId(TestID.PortfolioOverviewEarnError)).toBeInTheDocument()
    expect(screen.getByText('An error occurred loading your balance')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.PortfolioOverviewEarnSection)).toBeNull()

    fireEvent.click(screen.getByTestId(TestID.PortfolioOverviewEarnRetry))
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows the localized rewards indicator when lifetime earnings fail but keeps the module and balances', () => {
    mockEarnQueries({
      vaults: [USDC_VAULT],
      positions: [
        new DataApiEarnPosition({
          vault: USDC_VAULT,
          sharesRaw: '1000000',
          currentAssetsRaw: '1000000000',
          currentAssetsUsd: 1000,
        }),
      ],
      lifetimeEarningsError: true,
    })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    // Module + balances still render; only the lifetime earnings value is replaced by the indicator.
    expect(screen.getByTestId(TestID.PortfolioOverviewEarnSection)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.PortfolioOverviewEarnTotalDeposited)).toHaveTextContent('$1,000.00')
    expect(screen.getByTestId(TestID.RewardsUnavailable)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.PortfolioOverviewEarnLifetimeEarnings)).toBeNull()
  })

  it('keeps showing stale vault data instead of the error state when a refetch fails', () => {
    mockEarnQueries({ vaults: [USDC_VAULT], positions: [], positionsError: true })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.getByTestId(TestID.PortfolioOverviewEarnSection)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.PortfolioOverviewEarnError)).toBeNull()
  })

  it('renders skeleton rows while either query is loading', () => {
    mockEarnQueries({
      vaults: [],
      positions: [],
      vaultsLoading: true,
      positionsLoading: true,
    })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.getByTestId(TestID.PortfolioOverviewEarnSection)).toBeInTheDocument()
    expect(screen.getAllByTestId(TestID.PortfolioOverviewEarnVaultRowSkeleton)).toHaveLength(3)
  })

  it('does not log a Portfolio impression when loading settles with no vaults', () => {
    mockEarnQueries({ vaults: [], positions: [], vaultsLoading: true })

    const { rerender } = render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()

    mockEarnQueries({ vaults: [], positions: [] })
    rerender(<PortfolioEarnSection key="settled" account={ACCOUNT} />)

    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('does not log a Portfolio impression when loading settles with an error', () => {
    mockEarnQueries({ vaults: [], positions: [], vaultsLoading: true })

    const { rerender } = render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()

    mockEarnQueries({ vaults: [], positions: [], vaultsError: true })
    rerender(<PortfolioEarnSection key="settled" account={ACCOUNT} />)

    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('logs one Portfolio impression when loading settles with visible vault content', () => {
    mockEarnQueries({ vaults: [], positions: [], vaultsLoading: true })

    const { rerender } = render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()

    mockEarnQueries({ vaults: [USDC_VAULT], positions: [] })
    rerender(<PortfolioEarnSection key="settled" account={ACCOUNT} />)

    expect(screen.getByTestId(TestID.PortfolioOverviewEarnSection)).toBeInTheDocument()
    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(EarnEventName.EarnSurfaceViewed, {
      entry_point: 'portfolio_earn_section',
      surface: 'web',
    })
  })

  it('orders vaults with active positions before vaults without', () => {
    mockPortfolioBalances([USDC_CURRENCY_ID])
    mockEarnQueries({
      vaults: [USDC_VAULT, WETH_VAULT, DAI_VAULT],
      positions: [
        new DataApiEarnPosition({
          vault: DAI_VAULT,
          sharesRaw: '500000000000000000',
          currentAssetsRaw: '500000000000000000',
          currentAssetsUsd: 250,
        }),
      ],
    })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    const earnRowTestIdPattern = new RegExp(
      `^(${TestID.PortfolioOverviewEarnVaultRowPrefix}|${TestID.PortfolioOverviewEarnGetTokenRowPrefix})`,
    )
    const orderedIds = screen.getAllByTestId(earnRowTestIdPattern).map((node) => node.getAttribute('data-testid'))
    expect(orderedIds).toEqual([
      `${TestID.PortfolioOverviewEarnVaultRowPrefix}${getEarnVaultId({
        chainId: UniverseChainId.Mainnet,
        vaultAddress: DAI_VAULT_ADDRESS,
      })}`,
      `${TestID.PortfolioOverviewEarnVaultRowPrefix}${getEarnVaultId({
        chainId: UniverseChainId.Mainnet,
        vaultAddress: USDC_VAULT_ADDRESS,
      })}`,
      `${TestID.PortfolioOverviewEarnGetTokenRowPrefix}${getEarnVaultId({
        chainId: UniverseChainId.Mainnet,
        vaultAddress: WETH_VAULT_ADDRESS,
      })}`,
    ])
  })

  it('shows a Deposit button for vaults without a position and opens the vault details when pressed', () => {
    mockPortfolioBalances([USDC_CURRENCY_ID])
    mockEarnQueries({ vaults: [USDC_VAULT], positions: [] })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    const depositButton = screen.getByText('Deposit')

    fireEvent.click(depositButton)

    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-initial-view', 'vault')
  })

  it('shows a get-token row for vaults without a position or token balance', () => {
    mockEarnQueries({ vaults: [USDC_VAULT], positions: [] })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.queryByText('Deposit')).toBeNull()

    const getTokenRow = screen.getByText('Get USDC')
    expect(getTokenRow).toBeInTheDocument()

    fireEvent.click(getTokenRow)

    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-initial-view', 'deposit-amount')
  })

  it('does not show Deposit for a vault just because the wallet holds another vault token', () => {
    mockPortfolioBalances([USDC_CURRENCY_ID])
    mockEarnQueries({ vaults: [USDC_VAULT, DAI_VAULT], positions: [] })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.getAllByText('Deposit')).toHaveLength(1)
    expect(screen.getByText('Get DAI')).toBeInTheDocument()
  })

  it('does not use placeholder portfolio balances for Earn eligibility while a new wallet loads', () => {
    mockPortfolioBalances([USDC_CURRENCY_ID], { loading: true })
    mockEarnQueries({ vaults: [USDC_VAULT], positions: [] })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.queryByText('Deposit')).toBeNull()
    expect(screen.getAllByTestId(TestID.PortfolioOverviewEarnVaultRowSkeleton)).toHaveLength(3)
  })

  it('does not show get-token rows when portfolio balances fail without cached data', () => {
    mockPortfolioBalancesError()
    mockEarnQueries({ vaults: [USDC_VAULT], positions: [] })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.queryByText('Get USDC')).toBeNull()
    expect(screen.getAllByTestId(TestID.PortfolioOverviewEarnVaultRowSkeleton)).toHaveLength(3)
  })

  it('keeps using real cached portfolio balances during same-wallet refetches', () => {
    mockPortfolioBalances([USDC_CURRENCY_ID], { dataUpdatedAt: 1710000000000, loading: true })
    mockEarnQueries({ vaults: [USDC_VAULT], positions: [] })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.getByText('Deposit')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.PortfolioOverviewEarnVaultRowSkeleton)).toBeNull()
  })

  it('keeps using cached portfolio balances after a balance lookup error', () => {
    mockPortfolioBalances([USDC_CURRENCY_ID], {
      dataUpdatedAt: 1710000000000,
      error: new Error('Portfolio balance lookup failed'),
    })
    mockEarnQueries({ vaults: [USDC_VAULT], positions: [] })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.getByText('Deposit')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.PortfolioOverviewEarnVaultRowSkeleton)).toBeNull()
  })

  it('sums lifetime earnings from per-vault GetEarnPosition responses', () => {
    mockEarnQueries({
      vaults: [DAI_VAULT, USDC_VAULT],
      positions: [
        new DataApiEarnPosition({
          vault: USDC_VAULT,
          sharesRaw: '1000000',
          currentAssetsRaw: '1000000000',
          currentAssetsUsd: 1000,
        }),
        new DataApiEarnPosition({
          vault: DAI_VAULT,
          sharesRaw: '500000000000000000',
          currentAssetsRaw: '500000000000000000',
          currentAssetsUsd: 250,
        }),
      ],
      lifetimePnlByVaultAddress: {
        [USDC_VAULT_ADDRESS]: 12.34,
        [DAI_VAULT_ADDRESS]: 5.66,
      },
    })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.getByTestId(TestID.PortfolioOverviewEarnLifetimeEarnings)).toHaveTextContent('$18.00')
  })
})
