import { useSortedAccountList } from 'src/app/features/accounts/useSortedAccountList'
import { renderHook } from 'src/test/test-utils'
import type { MockedFunction } from 'vitest'
import { useAccountListData } from 'wallet/src/features/accounts/useAccountListData'

vi.mock('wallet/src/features/accounts/useAccountListData')
const mockUseAccountList = useAccountListData as MockedFunction<typeof useAccountListData>

describe('useSortedAccountList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should sort addresses by balance in descending order', () => {
    mockAccountList({ address1: 100, address2: 200, address3: 150 })

    const addresses = ['address1', 'address2', 'address3']
    const { result } = renderHook(() => useSortedAccountList(addresses))

    expect(result.current).toEqual([
      { address: 'address2', balance: 200 },
      { address: 'address3', balance: 150 },
      { address: 'address1', balance: 100 },
    ])
  })

  it('should default missing balances to 0 while data is loading', () => {
    mockAccountList(undefined, true)

    const addresses = ['address1', 'address2']
    const { result } = renderHook(() => useSortedAccountList(addresses))

    expect(result.current).toEqual([
      { address: 'address1', balance: 0 },
      { address: 'address2', balance: 0 },
    ])
  })

  it('should only include requested addresses when balances contain extra entries', () => {
    // Placeholder data retains the previous tuple's response, so a just-removed address can still appear.
    mockAccountList({ address1: 100, address2: 200, address3: 300 })

    const { result, rerender } = renderHook((props) => useSortedAccountList(props), {
      initialProps: ['address1', 'address2', 'address3'],
    })

    expect(result.current).toEqual([
      { address: 'address3', balance: 300 },
      { address: 'address2', balance: 200 },
      { address: 'address1', balance: 100 },
    ])

    rerender(['address1', 'address2'])

    expect(result.current).toEqual([
      { address: 'address2', balance: 200 },
      { address: 'address1', balance: 100 },
    ])
  })
})

function mockAccountList(balancesByAddress: AddressTo<number | undefined> | undefined, loading = false): void {
  mockUseAccountList.mockReturnValue({
    balancesByAddress,
    loading,
    refetch: vi.fn(),
  })
}
