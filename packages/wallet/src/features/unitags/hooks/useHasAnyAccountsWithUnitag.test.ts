import { useUnitagsAddressesQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import type { MockedFunction } from 'vitest'
import { useHasAnyAccountsWithUnitag } from 'wallet/src/features/unitags/hooks/useHasAnyAccountsWithUnitag'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { renderHook } from 'wallet/src/test/test-utils'

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useSignerAccounts: vi.fn(),
  useActiveAccount: vi.fn().mockReturnValue(undefined),
}))

vi.mock('uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery', () => ({
  useUnitagsAddressesQuery: vi.fn(),
}))

const mockUseSignerAccounts = useSignerAccounts as MockedFunction<typeof useSignerAccounts>
const mockUseUnitagsAddressesQuery = useUnitagsAddressesQuery as MockedFunction<typeof useUnitagsAddressesQuery>

const mockQueryResult = (data: any): ReturnType<typeof useUnitagsAddressesQuery> =>
  ({
    data,
  }) as ReturnType<typeof useUnitagsAddressesQuery>

describe('useHasAnyAccountsWithUnitag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false when there are no signer accounts', () => {
    mockUseSignerAccounts.mockReturnValue([])
    mockUseUnitagsAddressesQuery.mockReturnValue(mockQueryResult(undefined))

    const { result } = renderHook(() => useHasAnyAccountsWithUnitag())

    expect(mockUseUnitagsAddressesQuery).toHaveBeenCalledWith({ params: undefined })
    expect(result.current).toBe(false)
  })

  it('returns false when no usernames are present', () => {
    mockUseSignerAccounts.mockReturnValue([{ address: '0xabc' }] as any)
    mockUseUnitagsAddressesQuery.mockReturnValue(
      mockQueryResult({
        usernames: {
          '0xabc': { username: undefined },
          '0xdef': {},
        },
      }),
    )

    const { result } = renderHook(() => useHasAnyAccountsWithUnitag())

    expect(result.current).toBe(false)
  })

  it('returns true when at least one username exists', () => {
    mockUseSignerAccounts.mockReturnValue([{ address: '0xabc' }, { address: '0xdef' }] as any)
    mockUseUnitagsAddressesQuery.mockReturnValue(
      mockQueryResult({
        usernames: {
          '0xabc': { username: undefined },
          '0xdef': { username: 'alice' },
        },
      }),
    )

    const { result } = renderHook(() => useHasAnyAccountsWithUnitag())

    expect(result.current).toBe(true)
  })
})
