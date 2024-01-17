import { ApolloError } from '@apollo/client'
import { ChainId, Token } from '@uniswap/sdk-core'
import { TokenDetailsPoolsTable } from 'components/Tokens/TokenDetails/tables/TokenDetailsPoolsTable'
import { usePoolsFromTokenAddress } from 'graphql/thegraph/PoolsFromTokenAddress'
import Router from 'react-router-dom'
import { mocked } from 'test-utils/mocked'
import { validParams, validPoolToken0, validPoolToken1 } from 'test-utils/pools/fixtures'
import { render, screen } from 'test-utils/render'

jest.mock('graphql/thegraph/PoolsFromTokenAddress')
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}))

const mockToken = new Token(ChainId.MAINNET, validPoolToken0.id, 18)

describe('TDPPoolTable', () => {
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue(validParams)
  })

  it('renders loading state', () => {
    mocked(usePoolsFromTokenAddress).mockReturnValue({
      loading: true,
      error: undefined,
      pools: [],
      loadMore: jest.fn(),
    })

    const { asFragment } = render(<TokenDetailsPoolsTable chainId={ChainId.MAINNET} referenceToken={mockToken} />)
    expect(screen.getAllByTestId('cell-loading-bubble')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders error state', () => {
    mocked(usePoolsFromTokenAddress).mockReturnValue({
      loading: false,
      error: new ApolloError({ errorMessage: 'error fetching data' }),
      pools: [],
      loadMore: jest.fn(),
    })

    const { asFragment } = render(<TokenDetailsPoolsTable chainId={ChainId.MAINNET} referenceToken={mockToken} />)
    expect(screen.getByText('Error loading Top Pools')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders data filled state', () => {
    const mockData = [
      {
        token0: validPoolToken0,
        token1: validPoolToken1,
        feeTier: 10000,
        hash: '0x123',
        txCount: 200,
        tvl: 300,
        volume24h: 400,
        volumeWeek: 500,
        turnover: 600,
      },
    ]
    mocked(usePoolsFromTokenAddress).mockReturnValue({
      pools: mockData,
      loading: false,
      error: undefined,
      loadMore: jest.fn(),
    })

    const { asFragment } = render(<TokenDetailsPoolsTable chainId={ChainId.MAINNET} referenceToken={mockToken} />)
    expect(screen.getByTestId(`tdp-pools-table-${validPoolToken0.id}`)).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })
})
