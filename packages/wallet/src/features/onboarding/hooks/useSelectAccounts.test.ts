import { toContainAllValues, toContainValue } from 'jest-extended'
import { act } from 'react-test-renderer'
import { useSelectAccounts } from 'wallet/src/features/onboarding/hooks/useSelectAccounts'
import { renderHook } from 'wallet/src/test/test-utils'

expect.extend({ toContainAllValues, toContainValue })

const IMPORTABLE_ACCOUNTS_1 = [
  {
    address: '0xTest',
    balance: 573.04,
  },
  {
    address: '0xTest1',
    balance: 71.13,
  },
  {
    address: '0xTest2',
    balance: 32.88,
  },
]

const IMPORTABLE_ACCOUNTS_2 = [
  {
    address: '0xTest3',
    balance: 1513.34,
  },
  {
    address: '0xTest4',
    balance: 711.76,
  },
]

describe(useSelectAccounts, () => {
  it('initally returns all walletss selected', () => {
    const { result } = renderHook(() => useSelectAccounts(IMPORTABLE_ACCOUNTS_1))
    expect(result.current.selectedAddresses).toContainAllValues(['0xTest', '0xTest1', '0xTest2'])
  })

  it('updates initially selected accounts when passed accounts change', () => {
    const { result, rerender } = renderHook(useSelectAccounts, {
      initialProps: [IMPORTABLE_ACCOUNTS_1],
    })

    expect(result.current.selectedAddresses).toContainAllValues(['0xTest', '0xTest1', '0xTest2'])

    rerender([IMPORTABLE_ACCOUNTS_2])

    expect(result.current.selectedAddresses).toContainAllValues(['0xTest3', '0xTest4'])
  })

  it('deselects first wallet and selects it again', async () => {
    const { result } = renderHook(() => useSelectAccounts(IMPORTABLE_ACCOUNTS_1))

    expect(result.current.selectedAddresses).toContainAllValues(['0xTest', '0xTest1', '0xTest2'])

    await act(() => {
      result.current.toggleAddressSelection('0xTest')
    })

    expect(result.current.selectedAddresses).toContainAllValues(['0xTest1', '0xTest2'])

    await act(() => {
      result.current.toggleAddressSelection('0xTest')
    })

    expect(result.current.selectedAddresses).toContainAllValues(['0xTest', '0xTest1', '0xTest2'])
  })

  it('does not allow to deselect last wallet', async () => {
    const { result } = renderHook(() => useSelectAccounts(IMPORTABLE_ACCOUNTS_1))

    await act(() => {
      result.current.toggleAddressSelection('0xTest')
    })

    expect(result.current.selectedAddresses).toContainAllValues(['0xTest1', '0xTest2'])

    await act(() => {
      result.current.toggleAddressSelection('0xTest1')
    })

    expect(result.current.selectedAddresses).toContainValue('0xTest2')

    await act(() => {
      result.current.toggleAddressSelection('0xTest2')
    })

    expect(result.current.selectedAddresses).toContainValue('0xTest2')
  })
})
