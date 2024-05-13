import 'test-utils/tokens/mocks'

import { ApolloError } from '@apollo/client'
import { ChainId, Percent, Token } from '@uniswap/sdk-core'
import { TokenDetailsPoolsTable } from 'components/Tokens/TokenDetails/tables/TokenDetailsPoolsTable'
import { usePoolsFromTokenAddress } from 'graphql/data/pools/usePoolsFromTokenAddress'
import Router from 'react-router-dom'
import { mocked } from 'test-utils/mocked'
import { validBEPoolToken0, validBEPoolToken1, validParams, validPoolToken0 } from 'test-utils/pools/fixtures'
import { render, screen } from 'test-utils/render'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

jest.mock('graphql/data/pools/usePoolsFromTokenAddress')
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
      errorV3: undefined,
      errorV2: undefined,
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
      errorV3: new ApolloError({ errorMessage: 'error fetching data' }),
      errorV2: new ApolloError({ errorMessage: 'error fetching data' }),
      pools: [],
      loadMore: jest.fn(),
    })

    const { asFragment } = render(<TokenDetailsPoolsTable chainId={ChainId.MAINNET} referenceToken={mockToken} />)
    expect(screen.getByTestId('table-error-modal')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders data filled state', () => {
    const mockData = [
      {
        token0: validBEPoolToken0,
        token1: validBEPoolToken1,
        feeTier: 10000,
        hash: '0x123',
        txCount: 200,
        tvl: 300,
        volume24h: 400,
        volumeWeek: 500,
        oneDayApr: new Percent(6, 100),
        protocolVersion: ProtocolVersion.V3,
      },
    ]
    mocked(usePoolsFromTokenAddress).mockReturnValue({
      pools: mockData,
      loading: false,
      errorV3: undefined,
      errorV2: undefined,
      loadMore: jest.fn(),
    })

    const { asFragment } = render(<TokenDetailsPoolsTable chainId={ChainId.MAINNET} referenceToken={mockToken} />)
    expect(screen.getByTestId(`tdp-pools-table-${validPoolToken0.id}`)).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })
})
