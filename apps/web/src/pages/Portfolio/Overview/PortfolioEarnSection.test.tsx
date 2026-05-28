import { Token as DataApiToken, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  EarnPosition as DataApiEarnPosition,
  EarnVault as DataApiEarnVault,
} from '@uniswap/client-data-api/dist/data/v2/earn_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEarnVaultId } from 'uniswap/src/features/earn/utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { PortfolioEarnSection } from './PortfolioEarnSection'
import { fireEvent, render, screen } from '~/test-utils/render'

const ACCOUNT = '0x0000000000000000000000000000000000000001'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const USDC_VAULT_ADDRESS = '0x1111111111111111111111111111111111111111'
const DAI_VAULT_ADDRESS = '0x2222222222222222222222222222222222222222'

const mockUseQuery = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()

  return {
    ...actual,
    useQuery: mockUseQuery,
  }
})

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    convertFiatAmountFormatted: (value: number | string) =>
      `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    formatCurrencyAmount: ({ value }: { value: { toExact: () => string } }) =>
      Number(value.toExact()).toLocaleString('en-US', { maximumFractionDigits: 6 }),
    formatPercent: (value: number) => `${value.toFixed(2)}%`,
  }),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', async () => {
  const { Token } = await import('@uniswap/sdk-core')
  const { buildCurrencyId } = await import('uniswap/src/utils/currencyId')
  const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const daiCurrencyId = buildCurrencyId(1, daiAddress)

  return {
    useCurrencyInfo: (currencyId: string | undefined) => {
      const isDai = currencyId === daiCurrencyId
      const address = isDai ? daiAddress : usdcAddress
      const symbol = isDai ? 'DAI' : 'USDC'
      const decimals = isDai ? 18 : 6

      return {
        currency: new Token(1, address, decimals, symbol, symbol),
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

function mockEarnQueries({
  positions,
  vaults,
  positionsLoading = false,
  vaultsLoading = false,
}: {
  positions: DataApiEarnPosition[]
  vaults: DataApiEarnVault[]
  positionsLoading?: boolean
  vaultsLoading?: boolean
}): void {
  mockUseQuery.mockImplementation(
    ({ queryKey, select }: { queryKey?: readonly unknown[]; select?: (data: unknown) => unknown }) => {
      switch (queryKey?.[1]) {
        case 'listEarnVaults': {
          const data = { vaults }
          return {
            data: vaultsLoading && !vaults.length ? undefined : select ? select(data) : data,
            isLoading: vaultsLoading,
            isSuccess: !vaultsLoading,
          }
        }
        case 'listEarnPositions': {
          const data = { positions }
          return {
            data: positionsLoading && !positions.length ? undefined : select ? select(data) : data,
            isLoading: positionsLoading,
            isSuccess: !positionsLoading,
          }
        }
        default:
          return { data: undefined, isError: false, isLoading: false, isSuccess: false }
      }
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

describe('PortfolioEarnSection', () => {
  beforeEach(() => {
    mockUseQuery.mockReset()
  })

  it('renders aggregate deposits and opens the vault overview when a row with a position is pressed', () => {
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
      getEarnVaultId({ chainId: UniverseChainId.Mainnet, vaultAddress: USDC_VAULT_ADDRESS }),
    )
  })

  it('renders nothing when there are no vaults and queries are settled', () => {
    mockEarnQueries({ vaults: [], positions: [] })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.queryByTestId(TestID.PortfolioOverviewEarnSection)).toBeNull()
  })

  it('renders skeleton rows while either query is loading', () => {
    mockEarnQueries({ vaults: [], positions: [], vaultsLoading: true, positionsLoading: true })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    expect(screen.getByTestId(TestID.PortfolioOverviewEarnSection)).toBeInTheDocument()
    expect(screen.getAllByTestId(TestID.PortfolioOverviewEarnVaultRowSkeleton)).toHaveLength(3)
  })

  it('orders vaults with active positions before vaults without', () => {
    mockEarnQueries({
      vaults: [USDC_VAULT, DAI_VAULT],
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

    const orderedIds = screen
      .getAllByTestId(new RegExp(`^${TestID.PortfolioOverviewEarnVaultRowPrefix}`))
      .map((node) => node.getAttribute('data-testid'))
    expect(orderedIds).toEqual([
      `${TestID.PortfolioOverviewEarnVaultRowPrefix}${getEarnVaultId({ chainId: UniverseChainId.Mainnet, vaultAddress: DAI_VAULT_ADDRESS })}`,
      `${TestID.PortfolioOverviewEarnVaultRowPrefix}${getEarnVaultId({ chainId: UniverseChainId.Mainnet, vaultAddress: USDC_VAULT_ADDRESS })}`,
    ])
  })

  it('shows a Deposit button for vaults without a position and opens the modal when pressed', () => {
    mockEarnQueries({ vaults: [USDC_VAULT], positions: [] })

    render(<PortfolioEarnSection account={ACCOUNT} />)

    const depositButton = screen.getByText('Deposit')

    fireEvent.click(depositButton)

    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-initial-view', 'deposit-amount')
  })
})
