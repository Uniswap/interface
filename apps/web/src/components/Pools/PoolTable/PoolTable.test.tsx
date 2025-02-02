import 'test-utils/tokens/mocks'

import { Percent } from '@uniswap/sdk-core'
import { ExploreTopPoolTable } from 'components/Pools/PoolTable/PoolTable'
import Router from 'react-router-dom'
import { useExploreContextTopPools } from 'state/explore/topPools'
import { mocked } from 'test-utils/mocked'
import { validParams, validRestPoolToken0, validRestPoolToken1 } from 'test-utils/pools/fixtures'
import { render, screen } from 'test-utils/render'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

jest.mock('state/explore/topPools')
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}))

describe('PoolTable', () => {
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue(validParams)
  })

  it('renders loading state', () => {
    mocked(useExploreContextTopPools).mockReturnValue({
      isLoading: true,
      isError: false,
      topPools: [],
    })

    const { asFragment } = render(<ExploreTopPoolTable />)
    expect(screen.getAllByTestId('cell-loading-bubble')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders error state', () => {
    mocked(useExploreContextTopPools).mockReturnValue({
      isLoading: false,
      isError: true,
      topPools: [],
    })

    const { asFragment } = render(<ExploreTopPoolTable />)
    expect(screen.getByTestId('table-error-modal')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders data filled state', () => {
    const mockData = [
      {
        id: '1',
        chain: 'mainnet',
        token0: validRestPoolToken0,
        token1: validRestPoolToken1,
        feeTier: 10000,
        hash: '0x123',
        txCount: 200,
        tvl: 300,
        volume24h: 400,
        volumeWeek: 500,
        apr: new Percent(6, 100),
        volOverTvl: 1.84,
        protocolVersion: ProtocolVersion.V3,
      },
    ]
    mocked(useExploreContextTopPools).mockReturnValue({
      topPools: mockData,
      isLoading: false,
      isError: false,
    })

    const { asFragment } = render(<ExploreTopPoolTable />)
    expect(screen.getByTestId('top-pools-explore-table')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })
})
