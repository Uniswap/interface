import 'test-utils/tokens/mocks'

import { Percent } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { ExploreTopPoolTable } from 'components/Pools/PoolTable/PoolTable'
import { useExploreContextTopPools } from 'state/explore/topPools'
import { mocked } from 'test-utils/mocked'
import { validRestPoolToken0, validRestPoolToken1 } from 'test-utils/pools/fixtures'
import { render, screen } from 'test-utils/render'
import { DEFAULT_TICK_SPACING } from 'uniswap/src/constants/pools'

vi.mock('state/explore/topPools')
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    default: actual,
    useParams: vi
      .fn()
      .mockReturnValue({ poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', chainName: 'ethereum' }),
  }
})

describe('PoolTable', () => {
  it('renders loading state', () => {
    mocked(useExploreContextTopPools).mockReturnValue({
      isLoading: true,
      isError: false,
      topPools: [],
      topBoostedPools: [],
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
      topBoostedPools: [],
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
        feeTier: {
          feeAmount: 10000,
          tickSpacing: DEFAULT_TICK_SPACING,
          isDynamic: false,
        },
        hash: '0x123',
        txCount: 200,
        tvl: 300,
        volume24h: 400,
        volumeWeek: 500,
        apr: new Percent(6, 100),
        volOverTvl: 1.84,
        protocolVersion: GraphQLApi.ProtocolVersion.V3,
      },
    ]
    mocked(useExploreContextTopPools).mockReturnValue({
      topPools: mockData,
      topBoostedPools: mockData,
      isLoading: false,
      isError: false,
    })

    const { asFragment } = render(<ExploreTopPoolTable />)
    expect(screen.getByTestId('top-pools-explore-table')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })
})
