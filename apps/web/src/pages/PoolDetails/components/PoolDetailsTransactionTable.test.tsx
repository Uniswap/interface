import { useParams } from 'react-router'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { useAbbreviatedTimeString } from '~/components/Table/utils/useAbbreviatedTimeString'
import {
  PoolTableTransactionType,
  usePoolTransactions,
} from '~/features/Explore/state/transactions/usePoolTransactions'
import { PoolDetailsTransactionsTable } from '~/pages/PoolDetails/components/PoolDetailsTransactionsTable'
import { mocked } from '~/test-utils/mocked'
import { usdcWethPoolAddress, validParams } from '~/test-utils/pools/fixtures'
import { render, screen } from '~/test-utils/render'

vi.mock('~/features/Explore/state/transactions/usePoolTransactions')
vi.mock('~/components/Table/utils/useAbbreviatedTimeString', async () => {
  const actual = await vi.importActual('~/components/Table/utils/useAbbreviatedTimeString')
  return {
    ...actual,
    useAbbreviatedTimeString: vi.fn(),
  }
})
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    default: actual.default,
    useParams: vi.fn(),
  }
})

describe('PoolDetailsTransactionsTable', () => {
  beforeEach(() => {
    mocked(useParams).mockReturnValue(validParams)
  })

  it('renders loading state', () => {
    mocked(usePoolTransactions).mockReturnValue({
      loading: true,
      error: null,
      transactions: [],
      loadMore: vi.fn(),
    })

    const { asFragment } = render(<PoolDetailsTransactionsTable poolAddress={usdcWethPoolAddress} />)
    expect(screen.getAllByTestId('cell-loading-bubble')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders error state', () => {
    mocked(usePoolTransactions).mockReturnValue({
      loading: false,
      error: new Error('error fetching data'),
      transactions: [],
      loadMore: vi.fn(),
    })

    const { asFragment } = render(<PoolDetailsTransactionsTable poolAddress={usdcWethPoolAddress} />)
    expect(screen.getByTestId('table-error-modal')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders data filled state', () => {
    const mockData = [
      {
        timestamp: 1000000,
        transaction: '0x123',
        pool: {
          token0: {
            id: 'Token0',
            symbol: 'Token0',
          },
          token1: {
            id: 'Token1',
            symbol: 'Token1',
          },
        },
        maker: '0xabc',
        amount0: 200,
        amount1: 300,
        amountUSD: 400,
        type: PoolTableTransactionType.BUY,
      },
    ]
    mocked(usePoolTransactions).mockReturnValue({
      transactions: mockData,
      loading: false,
      error: null,
      loadMore: vi.fn(),
    })
    mocked(useAbbreviatedTimeString).mockReturnValue('1mo ago')

    const { asFragment } = render(<PoolDetailsTransactionsTable poolAddress={usdcWethPoolAddress} />)
    expect(screen.getByTestId('pool-details-transactions-table')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it.each([
    ['absent', undefined],
    ['zero', ZERO_ADDRESS],
  ])('puts the native token amount under the native token column (%s address)', (_, nativeAddress) => {
    const wethAddress = WRAPPED_NATIVE_CURRENCY[1]?.address ?? null
    const ethToken: ParsedToken = { chainId: 1, address: nativeAddress, symbol: 'ETH', decimals: 18 }
    const usdcToken: ParsedToken = {
      chainId: 1,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      decimals: 6,
    }
    mocked(usePoolTransactions).mockReturnValue({
      transactions: [
        {
          timestamp: 1000000,
          transaction: '0x123',
          pool: {
            token0: { id: wethAddress, symbol: 'ETH' },
            token1: { id: usdcToken.address ?? null, symbol: 'USDC' },
          },
          maker: '0xabc',
          amount0: 0.42177,
          amount1: 1095.6,
          amountUSD: 2123.74,
          type: PoolTableTransactionType.ADD,
        },
      ],
      loading: false,
      error: null,
      loadMore: vi.fn(),
    })
    mocked(useAbbreviatedTimeString).mockReturnValue('1mo ago')

    render(<PoolDetailsTransactionsTable poolAddress={usdcWethPoolAddress} token0={ethToken} token1={usdcToken} />)

    const ethAmount = screen.getByText(/^0\.4217/)
    const usdcAmount = screen.getByText(/^1.?095/)
    expect(ethAmount.compareDocumentPosition(usdcAmount) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
