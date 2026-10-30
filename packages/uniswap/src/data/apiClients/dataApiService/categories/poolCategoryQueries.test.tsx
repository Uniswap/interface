import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react-native'
import { GetCategoryResponse, ListCategoriesResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import {
  Category,
  CategoryClass,
  CategoryKind,
  RankedCategory,
  RankedPoolCategory,
} from '@uniswap/client-data-api/dist/data/v2/categories_pb'
import { UniverseChainId } from '@universe/chains'
import { createElement, type PropsWithChildren } from 'react'
import { useGetPoolCategoryQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useGetPoolCategoryQuery'
import { useListPoolCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListPoolCategoriesQuery'
import { usePoolCategoryBySlug } from 'uniswap/src/data/apiClients/dataApiService/categories/usePoolCategoryBySlug'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { Language } from 'uniswap/src/features/language/constants'

const { mockUseIsPoolCategoriesEnabled, mockUseCurrentLanguage } = vi.hoisted(() => ({
  mockUseIsPoolCategoriesEnabled: vi.fn(() => true),
  mockUseCurrentLanguage: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsPoolCategoriesEnabled: mockUseIsPoolCategoriesEnabled,
}))
vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { listCategories: vi.fn(), getCategory: vi.fn() },
}))
vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ chains: [UniverseChainId.Mainnet] }),
}))
vi.mock('uniswap/src/features/language/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/hooks')>()),
  useCurrentLanguage: mockUseCurrentLanguage,
}))

const mockListCategories = vi.mocked(dataApiServiceClientV2.listCategories)
const mockGetCategory = vi.mocked(dataApiServiceClientV2.getCategory)

const stablePools = new RankedPoolCategory({
  category: new Category({
    id: 'stable-pools',
    name: 'Stables',
    class: CategoryClass.ASSET,
    kind: CategoryKind.POOL,
    nameTranslations: { 'fr-FR': 'Stables (fr)' },
  }),
  stats: { poolCount: 310, tvl: 8.9e8, volume1d: 5.4e8, fees1d: 4.2e5 },
})
const majorPools = new RankedPoolCategory({
  category: new Category({ id: 'major-pools', name: 'Majors', class: CategoryClass.ASSET, kind: CategoryKind.POOL }),
})
const tokenDefi = new RankedCategory({
  category: new Category({ id: 'defi', name: 'DeFi', class: CategoryClass.SECTOR }),
})

describe('pool category queries', () => {
  let queryClient: QueryClient

  function Wrapper({ children }: PropsWithChildren): JSX.Element {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mockUseIsPoolCategoriesEnabled.mockReturnValue(true)
    mockUseCurrentLanguage.mockReturnValue(Language.English)
    mockListCategories
      .mockReset()
      .mockResolvedValue(new ListCategoriesResponse({ poolCategories: [stablePools, majorPools] }))
    mockGetCategory.mockReset()
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  describe(useListPoolCategoriesQuery, () => {
    it('requests kind POOL and maps the pool categories in BE order', async () => {
      const { result } = renderHook(() => useListPoolCategoriesQuery(), { wrapper: Wrapper })

      await waitFor(() =>
        expect(result.current.data?.map((category) => category.id)).toEqual(['stable-pools', 'major-pools']),
      )
      expect(mockListCategories).toHaveBeenCalledWith({ chainIds: [UniverseChainId.Mainnet], kind: CategoryKind.POOL })
      expect(result.current.data?.[0]).toMatchObject({ kind: 'pool', name: 'Stables', stats: { poolCount: 310 } })
    })

    it('localizes names in select without touching the cached English copy', async () => {
      mockUseCurrentLanguage.mockReturnValue(Language.French)
      const { result } = renderHook(() => useListPoolCategoriesQuery(), { wrapper: Wrapper })

      await waitFor(() => expect(result.current.data?.[0]?.name).toBe('Stables (fr)'))
      expect(result.current.data?.[0]?.englishName).toBe('Stables')
    })

    it('does not fetch while the flag is off', () => {
      mockUseIsPoolCategoriesEnabled.mockReturnValue(false)
      const { result } = renderHook(() => useListPoolCategoriesQuery(), { wrapper: Wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(mockListCategories).not.toHaveBeenCalled()
    })
  })

  describe(usePoolCategoryBySlug, () => {
    it('resolves a slug against the cached pool list', async () => {
      const { result } = renderHook(() => usePoolCategoryBySlug('Major-Pools'), { wrapper: Wrapper })

      await waitFor(() => expect(result.current.category?.id).toBe('major-pools'))
    })
  })

  describe(useGetPoolCategoryQuery, () => {
    it('reads pool_category and the three series', async () => {
      mockGetCategory.mockResolvedValue(
        new GetCategoryResponse({
          poolCategory: stablePools,
          volumeSeries: [{ timestamp: 1700000000n, value: 1 }],
          tvlSeries: [{ timestamp: 1700000000n, value: 2 }],
          feesSeries: [{ timestamp: 1700000000n, value: 3 }],
        }),
      )
      const { result } = renderHook(() => useGetPoolCategoryQuery('stable-pools'), { wrapper: Wrapper })

      await waitFor(() => expect(result.current.data).not.toBeUndefined())
      expect(mockGetCategory).toHaveBeenCalledWith({
        categoryId: 'stable-pools',
        chainIds: [UniverseChainId.Mainnet],
        includeCharts: true,
      })
      expect(result.current.data).toMatchObject({
        category: { id: 'stable-pools', kind: 'pool' },
        volumeSeries: [{ timestamp: 1700000000000, value: 1 }],
        tvlSeries: [{ timestamp: 1700000000000, value: 2 }],
        feesSeries: [{ timestamp: 1700000000000, value: 3 }],
      })
    })

    it('returns null when the id resolves to a token category', async () => {
      mockGetCategory.mockResolvedValue(new GetCategoryResponse({ category: tokenDefi }))
      const { result } = renderHook(() => useGetPoolCategoryQuery('defi'), { wrapper: Wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toBeNull()
    })
  })
})
