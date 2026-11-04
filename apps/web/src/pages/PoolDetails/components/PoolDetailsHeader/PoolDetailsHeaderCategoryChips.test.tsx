import userEvent from '@testing-library/user-event'
import { UniverseChainId } from '@universe/chains'
import { useIsPoolCategoriesEnabled } from '@universe/gating'
import { TestID } from '@universe/test'
import { useResolvePoolCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useResolvePoolCategories'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { poolCategory } from 'uniswap/src/test/fixtures/poolCategory'
import { PoolDetailsHeaderCategoryChips } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsHeaderCategoryChips'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsPoolCategoriesEnabled: vi.fn(),
}))
vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useResolvePoolCategories', () => ({
  useResolvePoolCategories: vi.fn(),
}))
vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))

const PDP_PATHNAME = '/explore/pools/ethereum/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'
const POOL_ADDRESS = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'
const STABLES = poolCategory({ id: 'stable-pools', name: 'Stables' })
const CORRELATED = poolCategory({ id: 'correlated', name: 'Correlated' })

function renderChips(categoryIds: string[] | undefined = ['stable-pools', 'correlated']): void {
  render(
    <PoolDetailsHeaderCategoryChips
      categoryIds={categoryIds}
      poolLoading={false}
      chainId={UniverseChainId.Mainnet}
      poolAddress={POOL_ADDRESS}
      poolName="USDC / ETH"
    />,
  )
}

describe('PoolDetailsHeaderCategoryChips', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useIsPoolCategoriesEnabled).mockReturnValue(true)
    mocked(useResolvePoolCategories).mockReturnValue({ categories: [STABLES, CORRELATED], isLoading: false })
    window.history.pushState({}, '', PDP_PATHNAME)
  })

  it('renders one chip per category in order, each linking to the pool category page', () => {
    renderChips()
    expect(screen.getByTestId(TestID.PoolDetailsCollections)).toHaveTextContent('StablesCorrelated')
    expect(screen.getByText('Correlated').closest('a')).toHaveAttribute('href', '/pools/category/correlated')
  })

  it('logs the chip press and navigates with this pool as the breadcrumb entry point', async () => {
    renderChips()
    await userEvent.click(screen.getByText('Stables'))

    expect(mocked(sendAnalyticsEvent).mock.calls[0]?.[1]).toEqual({
      element: ElementName.PDPCollectionsChip,
      category_id: 'stable-pools',
      category_kind: 'pool',
      category_index: 0,
      pool_address: POOL_ADDRESS,
      chain_id: UniverseChainId.Mainnet,
      tags_rendered_count: 2,
    })
    expect(mockNavigate).toHaveBeenCalledWith('/pools/category/stable-pools', {
      state: { from: PDP_PATHNAME, fromLabel: 'USDC / ETH' },
    })
  })

  it('renders nothing with the flag off', () => {
    mocked(useIsPoolCategoriesEnabled).mockReturnValue(false)
    renderChips()
    expect(screen.queryByTestId(TestID.PoolDetailsCollections)).not.toBeInTheDocument()
  })

  it('reserves the row with a skeleton only while a tagged pool is still resolving', () => {
    mocked(useResolvePoolCategories).mockReturnValue({ categories: [], isLoading: true })
    renderChips()
    expect(screen.getByTestId(TestID.PoolDetailsCollections)).toBeInTheDocument()
  })

  it('renders nothing for a pool with no categories', () => {
    mocked(useResolvePoolCategories).mockReturnValue({ categories: [], isLoading: false })
    renderChips([])
    expect(screen.queryByTestId(TestID.PoolDetailsCollections)).not.toBeInTheDocument()
  })
})
