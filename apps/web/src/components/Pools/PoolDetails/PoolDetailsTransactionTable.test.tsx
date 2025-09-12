import { PoolTableTransactionType, usePoolTransactions } from 'appGraphql/data/pools/usePoolTransactions'
import { ApolloError } from '@apollo/client'
import { PoolDetailsTransactionsTable } from 'components/Pools/PoolDetails/PoolDetailsTransactionsTable'
import { useAbbreviatedTimeString } from 'components/Table/utils'
import { useParams } from 'react-router'
import { mocked } from 'test-utils/mocked'
import { usdcWethPoolAddress, validParams } from 'test-utils/pools/fixtures'
import { render, screen } from 'test-utils/render'

vi.mock('appGraphql/data/pools/usePoolTransactions')
vi.mock('components/Table/utils')
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
      error: undefined,
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
      error: new ApolloError({ errorMessage: 'error fetching data' }),
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
      error: undefined,
      loadMore: vi.fn(),
    })
    mocked(useAbbreviatedTimeString).mockReturnValue('1mo ago')

    const { asFragment } = render(<PoolDetailsTransactionsTable poolAddress={usdcWethPoolAddress} />)
    expect(screen.getByTestId('pool-details-transactions-table')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })
})
