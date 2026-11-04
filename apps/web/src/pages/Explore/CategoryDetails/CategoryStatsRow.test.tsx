import type { UseQueryResult } from '@tanstack/react-query'
import { TestID } from '@universe/test'
import { useGetCategoryQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useGetCategoryQuery'
import { useGetPoolCategoryQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useGetPoolCategoryQuery'
import type { PoolCategoryDetail, TokenCategoryDetail } from 'uniswap/src/features/tokenCategories/types'
import { poolCategory } from 'uniswap/src/test/fixtures/poolCategory'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { CategoryStatsRow } from '~/pages/Explore/CategoryDetails/CategoryStatsRow'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useGetCategoryQuery')
vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useGetPoolCategoryQuery')

function mockToken(detail: TokenCategoryDetail | null | undefined, isLoading = false): void {
  mocked(useGetCategoryQuery).mockReturnValue({ data: detail, isLoading } as UseQueryResult<TokenCategoryDetail | null>)
}

function mockPool(detail: PoolCategoryDetail | null | undefined, isLoading = false): void {
  mocked(useGetPoolCategoryQuery).mockReturnValue({
    data: detail,
    isLoading,
  } as UseQueryResult<PoolCategoryDetail | null>)
}

const series = [
  { timestamp: 1, value: 100 },
  { timestamp: 2, value: 150 },
]

const poolStats = {
  poolCount: 310,
  tvl: 2_500_000_000,
  volume1d: 540_000_000,
  volume1w: 0,
  volume1m: 0,
  fees1d: 1_200_000,
}

describe('CategoryStatsRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken(undefined)
    mockPool(undefined)
  })

  it('shows TVL, 1D volume and total fees with sparklines for a pool category', () => {
    mockPool({
      category: poolCategory({ id: 'stable-pools', stats: poolStats }),
      tvlSeries: series,
      volumeSeries: series,
      feesSeries: series,
    })
    render(<CategoryStatsRow kind="pool" categoryId="stable-pools" />)

    expect(screen.getByText('TVL')).toBeInTheDocument()
    expect(screen.getByText('$2.5B')).toBeInTheDocument()
    expect(screen.getByText('1D Volume')).toBeInTheDocument()
    expect(screen.getByText('$540.0M')).toBeInTheDocument()
    expect(screen.getByText('24H fees')).toBeInTheDocument()
    expect(screen.getByText('$1.2M')).toBeInTheDocument()
    expect(screen.getAllByTestId(TestID.CategoryStat)).toHaveLength(3)
    expect(useGetCategoryQuery).not.toHaveBeenCalled()
  })

  it('leaves out a pool stat the backend serves as zero', () => {
    mockPool({
      category: poolCategory({ id: 'new-pools', stats: { ...poolStats, fees1d: 0 } }),
      tvlSeries: [],
      volumeSeries: [],
      feesSeries: [],
    })
    render(<CategoryStatsRow kind="pool" categoryId="new-pools" />)

    expect(screen.getByText('TVL')).toBeInTheDocument()
    expect(screen.queryByText('24H fees')).not.toBeInTheDocument()
  })

  it('renders three skeleton tiles while a pool category detail loads', () => {
    mockPool(undefined, true)
    render(<CategoryStatsRow kind="pool" categoryId="stable-pools" />)
    expect(screen.getAllByTestId(TestID.CategoryStatSkeleton)).toHaveLength(3)
    expect(screen.queryByTestId(TestID.CategoryStat)).not.toBeInTheDocument()
  })

  it('keeps the token page on volume and FDV from the token query', () => {
    mockToken({
      category: tokenCategory({
        id: 'defi',
        stats: {
          tokenCount: 1,
          priceChange24hPct: 0,
          volume1h: 0,
          volume1d: 90_000_000,
          volume1w: 0,
          volume1m: 0,
          volume1y: 0,
          fdv: 4_000_000_000,
        },
      }),
      volumeSeries: series,
      fdvSeries: series,
    })
    render(<CategoryStatsRow kind="token" categoryId="defi" />)

    expect(screen.getByText('1D Volume')).toBeInTheDocument()
    expect(screen.getByText('FDV')).toBeInTheDocument()
    expect(screen.queryByText('TVL')).not.toBeInTheDocument()
    expect(useGetPoolCategoryQuery).not.toHaveBeenCalled()
  })
})
