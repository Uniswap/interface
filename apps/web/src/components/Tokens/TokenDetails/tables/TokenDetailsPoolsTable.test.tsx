import 'test-utils/tokens/mocks'

import { usePoolsFromTokenAddress } from 'appGraphql/data/pools/usePoolsFromTokenAddress'
import { ApolloError } from '@apollo/client'
import { type Currency, Percent, Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { TokenDetailsPoolsTable } from 'components/Tokens/TokenDetails/tables/TokenDetailsPoolsTable'
import { mocked } from 'test-utils/mocked'
import { validBEPoolToken0, validBEPoolToken1 } from 'test-utils/pools/fixtures'
import { render, screen } from 'test-utils/render'
import { DEFAULT_TICK_SPACING } from 'uniswap/src/constants/pools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

vi.mock('appGraphql/data/pools/usePoolsFromTokenAddress')
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

const mockToken = new Token(UniverseChainId.Mainnet, validBEPoolToken0.id, 18)
const mockCurrency = {
  isToken: false,
  isNative: true,
  chainId: UniverseChainId.Mainnet,
  decimals: 18,
  wrapped: mockToken,
} as Currency

describe('TDPPoolTable', () => {
  it('renders loading state', () => {
    mocked(usePoolsFromTokenAddress).mockReturnValue({
      loading: true,
      errorV4: undefined,
      errorV3: undefined,
      errorV2: undefined,
      pools: [],
      loadMore: vi.fn(),
    })

    const { asFragment } = render(<TokenDetailsPoolsTable referenceCurrency={mockCurrency} />)
    expect(screen.getAllByTestId('cell-loading-bubble')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders error state', () => {
    mocked(usePoolsFromTokenAddress).mockReturnValue({
      loading: false,
      errorV4: new ApolloError({ errorMessage: 'error fetching data' }),
      errorV3: new ApolloError({ errorMessage: 'error fetching data' }),
      errorV2: new ApolloError({ errorMessage: 'error fetching data' }),
      pools: [],
      loadMore: vi.fn(),
    })

    const { asFragment } = render(<TokenDetailsPoolsTable referenceCurrency={mockCurrency} />)
    expect(screen.getByTestId('table-error-modal')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders data filled state', () => {
    const mockData = [
      {
        token0: validBEPoolToken0,
        token1: validBEPoolToken1,
        feeTier: {
          feeAmount: 10000,
          tickSpacing: DEFAULT_TICK_SPACING,
          isDynamic: false,
        },
        hash: '0x123',
        txCount: 200,
        tvl: 300,
        volume24h: 400,
        volume30d: 500,
        volOverTvl: 1.84,
        apr: new Percent(6, 100),
        protocolVersion: GraphQLApi.ProtocolVersion.V3,
      },
    ]
    mocked(usePoolsFromTokenAddress).mockReturnValue({
      pools: mockData,
      loading: false,
      errorV4: undefined,
      errorV3: undefined,
      errorV2: undefined,
      loadMore: vi.fn(),
    })

    const { asFragment } = render(<TokenDetailsPoolsTable referenceCurrency={mockCurrency} />)
    expect(screen.getByTestId(`tdp-pools-table-${validBEPoolToken0.id}`)).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })
})
