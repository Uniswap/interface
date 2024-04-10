import { ApolloError } from '@apollo/client'
import { Percent } from '@uniswap/sdk-core'
import { ProtocolVersion } from 'graphql/data/__generated__/types-and-hooks'
import { useTopPools } from 'graphql/data/pools/useTopPools'
import Router from 'react-router-dom'
import { mocked } from 'test-utils/mocked'
import { validBEPoolToken0, validBEPoolToken1, validParams } from 'test-utils/pools/fixtures'
import { render, screen } from 'test-utils/render'

import { TopPoolTable } from './PoolTable'

jest.mock('graphql/data/pools/useTopPools')
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}))

describe('PoolTable', () => {
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue(validParams)
  })

  it('renders loading state', () => {
    mocked(useTopPools).mockReturnValue({
      loading: true,
      error: undefined,
      topPools: [],
    })

    const { asFragment } = render(<TopPoolTable />)
    expect(screen.getAllByTestId('cell-loading-bubble')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders error state', () => {
    mocked(useTopPools).mockReturnValue({
      loading: false,
      error: new ApolloError({ errorMessage: 'error fetching data' }),
      topPools: [],
    })

    const { asFragment } = render(<TopPoolTable />)
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
        turnover: new Percent(6, 100),
        protocolVersion: ProtocolVersion.V3,
      },
    ]
    mocked(useTopPools).mockReturnValue({
      topPools: mockData,
      loading: false,
      error: undefined,
    })

    const { asFragment } = render(<TopPoolTable />)
    expect(screen.getByTestId('top-pools-explore-table')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })
})
