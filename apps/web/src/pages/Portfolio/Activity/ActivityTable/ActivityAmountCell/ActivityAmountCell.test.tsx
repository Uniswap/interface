import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ActivityAmountCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/ActivityAmountCell'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/tokens/useCurrencyInfo')>()),
  useCurrencyInfos: vi.fn(),
}))

const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'

function currencyInfoFixture(symbol: string, address: string): CurrencyInfo {
  return {
    currencyId: `${UniverseChainId.Mainnet}-${address}`,
    logoUrl: null,
    currency: {
      symbol,
      name: symbol,
      decimals: 18,
      chainId: UniverseChainId.Mainnet,
      address,
      isNative: false,
      isToken: true,
    },
  } as unknown as CurrencyInfo
}

function lpIncentivesClaim(id: string, tokenAddresses: string[]): TransactionDetails {
  return {
    routing: TradingApi.Routing.CLASSIC,
    id,
    chainId: UniverseChainId.Mainnet,
    status: TransactionStatus.Success,
    addedTime: 1,
    updatedTime: 1,
    from: '0x0000000000000000000000000000000000000001',
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: {} },
    typeInfo: { type: TransactionType.LPIncentivesClaimRewards, tokenAddresses },
  } as unknown as TransactionDetails
}

describe('ActivityAmountCell — LP incentives claims', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the bare symbol for a one-token claim, with no amount placeholder', () => {
    mocked(useCurrencyInfos).mockReturnValue([currencyInfoFixture('UNI', UNI_ADDRESS)])

    render(<ActivityAmountCell transaction={lpIncentivesClaim('one', [UNI_ADDRESS])} />)

    // A claim records no amount; the formatter's "-" placeholder must never reach the row.
    expect(screen.queryByText('- UNI')).not.toBeInTheDocument()
    expect(screen.getAllByText('UNI').length).toBeGreaterThan(0)
  })

  it('renders every token of a multi-token claim', () => {
    mocked(useCurrencyInfos).mockReturnValue([
      currencyInfoFixture('UNI', UNI_ADDRESS),
      currencyInfoFixture('USDC', USDC_ADDRESS),
    ])

    render(<ActivityAmountCell transaction={lpIncentivesClaim('multi', [UNI_ADDRESS, USDC_ADDRESS])} />)

    expect(screen.getByText('UNI, USDC')).toBeInTheDocument()
  })

  it('caps a large claim at three symbols with a remainder count', () => {
    mocked(useCurrencyInfos).mockReturnValue([
      currencyInfoFixture('UNI', UNI_ADDRESS),
      currencyInfoFixture('USDC', USDC_ADDRESS),
      currencyInfoFixture('DAI', DAI_ADDRESS),
      currencyInfoFixture('WBTC', WBTC_ADDRESS),
    ])

    render(
      <ActivityAmountCell
        transaction={lpIncentivesClaim('overflow', [UNI_ADDRESS, USDC_ADDRESS, DAI_ADDRESS, WBTC_ADDRESS])}
      />,
    )

    expect(screen.getByText('UNI, USDC, DAI +1')).toBeInTheDocument()
  })

  it('renders an empty cell when no reward currency resolves', () => {
    mocked(useCurrencyInfos).mockReturnValue([undefined, undefined])

    render(<ActivityAmountCell transaction={lpIncentivesClaim('unresolved', [UNI_ADDRESS, USDC_ADDRESS])} />)

    expect(screen.queryByText(/UNI/)).not.toBeInTheDocument()
  })

  it('keeps the type label on a compact row when no reward currency resolves', () => {
    mocked(useCurrencyInfos).mockReturnValue([undefined, undefined])

    render(
      <ActivityAmountCell
        transaction={lpIncentivesClaim('unresolved', [UNI_ADDRESS, USDC_ADDRESS])}
        variant="compact"
      />,
    )

    // The row must still say what it is; only the logos and symbols are unavailable.
    expect(screen.getByText('Collected fees')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })
})
