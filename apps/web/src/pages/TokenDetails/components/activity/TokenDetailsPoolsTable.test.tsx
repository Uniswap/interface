import '~/test-utils/tokens/mocks'
import { type Currency, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { DEFAULT_TICK_SPACING } from 'uniswap/src/constants/pools'
import { usePoolsFromTokenAddress } from '~/data/pools/usePoolsFromTokenAddress'
import { TokenDetailsPoolsTable } from '~/pages/TokenDetails/components/activity/TokenDetailsPoolsTable'
import { mocked } from '~/test-utils/mocked'
import { validBEPoolToken0, validRestPoolToken0, validRestPoolToken1 } from '~/test-utils/pools/fixtures'
import { render, screen } from '~/test-utils/render'
import type { PoolStat } from '~/types/explore'

vi.mock('~/data/pools/usePoolsFromTokenAddress')
vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: (selector: (s: { multiChainMap: Record<string, never> }) => unknown) => selector({ multiChainMap: {} }),
}))
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
      isError: false,
      pools: [],
      loadMore: vi.fn(),
    })

    const { asFragment } = render(<TokenDetailsPoolsTable referenceCurrency={mockCurrency} isMultichainView={false} />)
    expect(screen.getAllByTestId('cell-loading-bubble')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders error state', () => {
    mocked(usePoolsFromTokenAddress).mockReturnValue({
      loading: false,
      isError: true,
      pools: [],
      loadMore: vi.fn(),
    })

    const { asFragment } = render(<TokenDetailsPoolsTable referenceCurrency={mockCurrency} isMultichainView={false} />)
    expect(screen.getByTestId('table-error-modal')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders data filled state', () => {
    const mockData = [
      {
        id: '0x123',
        chainId: UniverseChainId.Mainnet,
        token0: validRestPoolToken0,
        token1: validRestPoolToken1,
        isToken0Quote: true,
        feeTier: {
          feeAmount: 10000,
          tickSpacing: DEFAULT_TICK_SPACING,
          isDynamic: false,
        },
        txCount: 200,
        totalLiquidity: { value: 300 },
        volume1Day: { value: 400 },
        volume30Day: { value: 500 },
        volOverTvl: 1.84,
        apr: 6,
        protocolVersion: 'V3',
      },
    ] as unknown as PoolStat[]
    mocked(usePoolsFromTokenAddress).mockReturnValue({
      pools: mockData,
      loading: false,
      isError: false,
      loadMore: vi.fn(),
    })

    const { asFragment } = render(<TokenDetailsPoolsTable referenceCurrency={mockCurrency} isMultichainView={false} />)
    expect(screen.getByTestId(`tdp-pools-table-${validBEPoolToken0.id}`)).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })
})
