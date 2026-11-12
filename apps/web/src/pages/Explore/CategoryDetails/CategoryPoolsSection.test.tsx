import { UniverseChainId } from '@universe/chains'
import { useNavigate, useSearchParams } from 'react-router'
import { poolCategory } from 'uniswap/src/test/fixtures/poolCategory'
import { PoolSortFields } from '~/data/pools/poolStats'
import { OrderDirection } from '~/data/util'
import { CategoryPoolsSection } from '~/pages/Explore/CategoryDetails/CategoryPoolsSection'
import { useListPools } from '~/pages/Explore/hooks/useListPools'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'
import { ADD_LIQUIDITY_PATH } from '~/utils/params/poolLinkParams'

vi.mock('~/pages/Explore/hooks/useListPools')
vi.mock('~/features/Liquidity/PoolsFilter/PoolsFilter', () => ({
  PoolsFilter: ({ search }: { search: React.ReactNode }) => <div data-testid="pools-filter">{search}</div>,
}))
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: vi.fn(),
  useSearchParams: vi.fn(),
}))

const stables = poolCategory({
  id: 'stable-pools',
  name: 'Stables',
  stats: { poolCount: 310, tvl: 1, volume1d: 1, volume1w: 1, volume1m: 1, fees1d: 1 },
})
const navigate = vi.fn()

function renderSection(search = ''): void {
  mocked(useSearchParams).mockReturnValue([new URLSearchParams(search), vi.fn()])
  render(<CategoryPoolsSection category={stables} />)
}

describe('CategoryPoolsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useNavigate).mockReturnValue(navigate)
    mocked(useListPools).mockReturnValue({
      pools: [],
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
    })
  })

  it('labels the section with the pool count and lists the category sorted by 1D volume', () => {
    renderSection()

    expect(screen.getByText('310 pools')).toBeInTheDocument()
    expect(useListPools).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'stable-pools',
        chainId: undefined,
        sortState: { sortBy: PoolSortFields.Volume24h, sortDirection: OrderDirection.Desc },
      }),
    )
  })

  it('scopes the list to the ?chain= filter', () => {
    renderSection('?chain=base')
    expect(useListPools).toHaveBeenCalledWith(expect.objectContaining({ chainId: UniverseChainId.Base }))
  })

  it('reads an unsupported chain deep link as All networks', () => {
    renderSection('?chain=solana')
    expect(useListPools).toHaveBeenCalledWith(expect.objectContaining({ chainId: undefined }))
  })

  it('opens Create Position from the New position button with the pools entry point', () => {
    renderSection()
    fireEvent.click(screen.getByRole('button', { name: /new position/i }))
    expect(navigate).toHaveBeenCalledWith(ADD_LIQUIDITY_PATH, { state: { entryPoint: '/explore/pools' } })
  })
})
