import { act, renderHook } from '@testing-library/react-native'
import { SharedQueryClient } from '@universe/api'
import { useHomeScreenPortfolioRefresh } from 'src/screens/HomeScreen/portfolio/hooks/useHomeScreenPortfolioRefresh'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { MockInstance } from 'vitest'

const mockRefetchQueries = vi.fn()

vi.mock('@apollo/client', async () => ({
  ...(await vi.importActual('@apollo/client')),
  useApolloClient: () => ({ refetchQueries: mockRefetchQueries }),
}))

vi.mock('wallet/src/features/wallet/hooks', async () => ({
  ...(await vi.importActual('wallet/src/features/wallet/hooks')),
  useActiveAccountWithThrow: () => ({ address: '0xabc' }),
}))

describe('useHomeScreenPortfolioRefresh', () => {
  let invalidateSpy: MockInstance

  beforeEach(() => {
    invalidateSpy = vi.spyOn(SharedQueryClient, 'invalidateQueries').mockResolvedValue(undefined)
  })

  afterEach(() => {
    invalidateSpy.mockRestore()
    mockRefetchQueries.mockReset()
  })

  const invalidatedKeys = (): unknown[][] =>
    invalidateSpy.mock.calls.map(([arg]) => (arg as { queryKey: unknown[] }).queryKey)

  it('invalidates GetWalletBalances so the header balance refreshes under the flag', async () => {
    const { result } = renderHook(() => useHomeScreenPortfolioRefresh({ shouldLoadNfts: false }))

    await act(async () => {
      await result.current.onRefresh()
    })

    expect(invalidatedKeys().some((key) => key[0] === ReactQueryCacheKey.GetWalletBalances)).toBe(true)
  })

  it('invalidates ListPositions so the Pools tab refreshes', async () => {
    const { result } = renderHook(() => useHomeScreenPortfolioRefresh({ shouldLoadNfts: false }))

    await act(async () => {
      await result.current.onRefresh()
    })

    expect(invalidatedKeys()).toContainEqual([ReactQueryCacheKey.ListPositions])
  })

  it('does not refetch NFT queries when the NFTs tab has not loaded', async () => {
    const { result } = renderHook(() => useHomeScreenPortfolioRefresh({ shouldLoadNfts: false }))

    await act(async () => {
      await result.current.onRefresh()
    })

    expect(mockRefetchQueries).not.toHaveBeenCalled()
  })
})
