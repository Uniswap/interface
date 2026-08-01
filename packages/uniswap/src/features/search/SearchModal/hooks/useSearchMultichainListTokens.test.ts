import { waitFor } from '@testing-library/react-native'
import { SharedQueryClient } from '@universe/api'
import { useSearchMultichainListTokens } from 'uniswap/src/features/search/SearchModal/hooks/useSearchMultichainListTokens'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'
import { renderHookWithProviders } from 'uniswap/src/test/render'

const { mockUseFeatureFlag, mockUseEnabledChains, mockV2ListTokens } = vi.hoisted(() => ({
  mockUseFeatureFlag: vi.fn(),
  mockUseEnabledChains: vi.fn(),
  mockV2ListTokens: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: mockUseFeatureFlag,
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/data/apiClients/dataApi/DataApiClientV2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApi/DataApiClientV2')>()),
  dataApiServiceClientV2: { listTokens: mockV2ListTokens },
}))

describe('useSearchMultichainListTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    SharedQueryClient.clear()
    mockUseEnabledChains.mockReturnValue({ chains: [1, 137] })
  })

  describe('V2EndpointsTokens off', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(false)
    })

    it('does not call the v2 ListTokens client', async () => {
      renderHookWithProviders(() => useSearchMultichainListTokens({ pageSize: 8, skip: false }))

      await waitFor(() => {
        expect(mockV2ListTokens).not.toHaveBeenCalled()
      })
    })

    it('returns no data and not loading', async () => {
      const { result } = renderHookWithProviders(() => useSearchMultichainListTokens({ pageSize: 8, skip: false }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.data).toBeUndefined()
      })
    })
  })

  describe('V2EndpointsTokens on', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(true)
    })

    it('calls the v2 ListTokens client with the expected request shape', async () => {
      mockV2ListTokens.mockResolvedValue({ multichainTokens: [] })

      renderHookWithProviders(() => useSearchMultichainListTokens({ pageSize: 8, skip: false }))

      await waitFor(() => {
        expect(mockV2ListTokens).toHaveBeenCalledWith(
          expect.objectContaining({
            chainIds: [1, 137],
            page: { pageSize: 8 },
            sort: { orderBy: expect.anything(), ascending: false },
          }),
        )
      })
    })

    it('skips the query when skip is true', async () => {
      renderHookWithProviders(() => useSearchMultichainListTokens({ pageSize: 8, skip: true }))

      await waitFor(() => {
        expect(mockV2ListTokens).not.toHaveBeenCalled()
      })
    })

    it('maps v2 RankedMultichainToken[] into MultichainSearchResult[]', async () => {
      mockV2ListTokens.mockResolvedValue({
        multichainTokens: [createRankedMultichainToken({ symbol: 'USDC', name: 'USD Coin' })],
      })

      const { result } = renderHookWithProviders(() => useSearchMultichainListTokens({ pageSize: 8, skip: false }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.data).toHaveLength(1)
      })
      expect(result.current.data?.[0]?.symbol).toBe('USDC')
    })

    it('returns undefined data when the response has no multichainTokens', async () => {
      mockV2ListTokens.mockResolvedValue({ multichainTokens: [] })

      const { result } = renderHookWithProviders(() => useSearchMultichainListTokens({ pageSize: 8, skip: false }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.data).toEqual([])
      })
    })

    it('exposes refetch from the query', async () => {
      mockV2ListTokens.mockResolvedValue({ multichainTokens: [] })

      const { result } = renderHookWithProviders(() => useSearchMultichainListTokens({ pageSize: 8, skip: false }))

      await waitFor(() => {
        expect(typeof result.current.refetch).toBe('function')
      })
    })
  })
})
