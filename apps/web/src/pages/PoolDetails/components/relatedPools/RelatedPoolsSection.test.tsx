import userEvent from '@testing-library/user-event'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { useIsPoolCategoriesEnabled } from '@universe/gating'
import { TestID } from '@universe/test'
import type { RelatedPoolCardItem } from 'uniswap/src/data/apiClients/dataApiService/relatedPools/relatedPoolMappers'
import { useRelatedPoolsQuery } from 'uniswap/src/data/apiClients/dataApiService/relatedPools/useRelatedPoolsQuery'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { poolCategory } from 'uniswap/src/test/fixtures/poolCategory'
import { RelatedPoolsSection } from '~/pages/PoolDetails/components/relatedPools/RelatedPoolsSection'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsPoolCategoriesEnabled: vi.fn(),
}))
vi.mock('uniswap/src/data/apiClients/dataApiService/relatedPools/useRelatedPoolsQuery', () => ({
  useRelatedPoolsQuery: vi.fn(),
}))
vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))

const STABLES = poolCategory({ id: 'stable-pools', name: 'Stables' })
const MAJORS = poolCategory({ id: 'major-pools', name: 'Majors' })

function pool(poolId: string, token0: string, token1: string): RelatedPoolCardItem {
  return {
    key: `1-${poolId}`,
    chainId: UniverseChainId.Mainnet,
    poolId,
    token0: { address: '0xa', symbol: token0 },
    token1: { address: '0xb', symbol: token1 },
    protocolVersion: ProtocolVersion.V3,
    feeTier: 500,
    isDynamicFee: false,
    tickSpacing: 10,
    tvl: 1_000_000,
  }
}

function renderSection(categories = [STABLES, MAJORS], isLoading = false): void {
  render(
    <RelatedPoolsSection
      categories={categories}
      isLoading={isLoading}
      chainId={UniverseChainId.Mainnet}
      poolId="0x1"
    />,
  )
}

describe('RelatedPoolsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useIsPoolCategoriesEnabled).mockReturnValue(true)
    mocked(useRelatedPoolsQuery).mockReturnValue({
      pools: [pool('0x2', 'USDC', 'USDT'), pool('0x3', 'DAI', 'USDC')],
      isLoading: false,
      isError: false,
    })
  })

  it('shows the header and a chip per category, querying the first category', () => {
    renderSection()
    expect(screen.getByTestId(TestID.PoolDetailsRelatedPools)).toHaveTextContent('Related pools')
    expect(screen.getByRole('button', { name: 'Stables' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Majors' })).toBeInTheDocument()
    expect(useRelatedPoolsQuery).toHaveBeenCalledWith({
      categoryId: 'stable-pools',
      subject: { chainId: UniverseChainId.Mainnet, poolId: '0x1' },
      enabled: true,
    })
    expect(screen.getByText('USDC/USDT')).toBeInTheDocument()
  })

  it('uses the singular title and no chips for a single category', () => {
    renderSection([MAJORS])
    expect(screen.getByText('More Majors pools')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Majors' })).not.toBeInTheDocument()
  })

  it('switches the queried category and logs the chip press', async () => {
    renderSection()
    await userEvent.click(screen.getByRole('button', { name: 'Majors' }))

    expect(mocked(sendAnalyticsEvent).mock.calls[0]?.[1]).toMatchObject({
      element: ElementName.PDPRelatedPoolsCategoryChip,
      category_id: 'major-pools',
      category_kind: 'pool',
      pool_address: '0x1',
    })
    expect(useRelatedPoolsQuery).toHaveBeenLastCalledWith(expect.objectContaining({ categoryId: 'major-pools' }))
  })

  it('reads a wrapped-native leg as the native symbol on v3, but not on v4', () => {
    const weth = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    mocked(useRelatedPoolsQuery).mockReturnValue({
      pools: [
        { ...pool('0x4', 'WETH', 'USDC'), token0: { address: weth, symbol: 'WETH' } },
        {
          ...pool('0x5', 'WETH', 'USDT'),
          token0: { address: weth, symbol: 'WETH' },
          protocolVersion: ProtocolVersion.V4,
        },
      ],
      isLoading: false,
      isError: false,
    })
    renderSection()
    expect(screen.getByText('ETH/USDC')).toBeInTheDocument()
    expect(screen.getByText('WETH/USDT')).toBeInTheDocument()
  })

  it('navigates to the pool details page from a card', async () => {
    renderSection()
    await userEvent.click(screen.getByText('DAI/USDC'))
    expect(mockNavigate).toHaveBeenCalledWith('/explore/pools/ethereum/0x3')
  })

  it('hides a chipless section with nothing to show, but keeps a chipped one', () => {
    mocked(useRelatedPoolsQuery).mockReturnValue({ pools: [], isLoading: false, isError: false })
    renderSection([MAJORS])
    expect(screen.queryByTestId(TestID.PoolDetailsRelatedPools)).not.toBeInTheDocument()

    renderSection()
    expect(screen.getByText('No pools found')).toBeInTheDocument()
  })

  it('renders nothing with the flag off', () => {
    mocked(useIsPoolCategoriesEnabled).mockReturnValue(false)
    renderSection()
    expect(screen.queryByTestId(TestID.PoolDetailsRelatedPools)).not.toBeInTheDocument()
  })
})
