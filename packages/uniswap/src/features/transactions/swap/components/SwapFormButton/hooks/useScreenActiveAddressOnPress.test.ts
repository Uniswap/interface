import { renderHook } from '@testing-library/react'
import { useScreenActiveAddressOnPress } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useScreenActiveAddressOnPress'

const {
  mockScreenAddress,
  mockUseActiveAddress,
  mockUseSwapFormStoreDerivedSwapInfo,
  mockHandleShowBlockedAddressModal,
} = vi.hoisted(() => ({
  mockScreenAddress: vi.fn(),
  mockUseActiveAddress: vi.fn(),
  mockUseSwapFormStoreDerivedSwapInfo: vi.fn(),
  mockHandleShowBlockedAddressModal: vi.fn(),
}))

// Keep the real `toScreenInput` so the input the screen receives is the production one.
vi.mock('@universe/compliance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/compliance')>()),
  useScreenAddressOnPress: () => ({ mutate: mockScreenAddress }),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: (...args: unknown[]) => mockUseActiveAddress(...args),
}))

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStoreDerivedSwapInfo: (selector: (s: unknown) => unknown) => mockUseSwapFormStoreDerivedSwapInfo(selector),
}))

vi.mock('uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/useSwapFormWarningStore', () => ({
  useSwapFormWarningStoreActions: () => ({ handleShowBlockedAddressModal: mockHandleShowBlockedAddressModal }),
}))

const ACTIVE_ADDRESS = '0x7f367cc41522ce07553e823bf3be79a889debe1b'
const CHAIN_ID = 1

/** Resolves the screen with `isBlocked`, as React Query would on a settled mutation. */
function settleScreenWith(isBlocked: boolean): void {
  mockScreenAddress.mockImplementation((_input, options) => options?.onSuccess?.(isBlocked))
}

describe(useScreenActiveAddressOnPress, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseActiveAddress.mockReturnValue(ACTIVE_ADDRESS)
    mockUseSwapFormStoreDerivedSwapInfo.mockReturnValue(CHAIN_ID)
  })

  it('screens the active address on the active chain', () => {
    settleScreenWith(false)
    const { result } = renderHook(() => useScreenActiveAddressOnPress())

    result.current(vi.fn())

    expect(mockScreenAddress).toHaveBeenCalledWith({ address: ACTIVE_ADDRESS, chainId: CHAIN_ID }, expect.anything())
  })

  it('continues when the address is clean', () => {
    settleScreenWith(false)
    const onClear = vi.fn()
    const { result } = renderHook(() => useScreenActiveAddressOnPress())

    result.current(onClear)

    expect(onClear).toHaveBeenCalledTimes(1)
    expect(mockHandleShowBlockedAddressModal).not.toHaveBeenCalled()
  })

  it('opens the blocked modal and does not continue when the address is blocked', () => {
    settleScreenWith(true)
    const onClear = vi.fn()
    const { result } = renderHook(() => useScreenActiveAddressOnPress())

    result.current(onClear)

    expect(mockHandleShowBlockedAddressModal).toHaveBeenCalledTimes(1)
    // The screened address goes to the modal, so a later wallet switch cannot retitle it.
    expect(mockHandleShowBlockedAddressModal).toHaveBeenCalledWith(ACTIVE_ADDRESS)
    expect(onClear).not.toHaveBeenCalled()
  })

  // Fail-open itself lives in the compliance package: the mutation resolves `false` on
  // error rather than rejecting, so an outage reaches this hook as the clean case above.
  it('skips the screen when there is no connected address', () => {
    mockUseActiveAddress.mockReturnValue(undefined)
    settleScreenWith(false)
    const onClear = vi.fn()
    const { result } = renderHook(() => useScreenActiveAddressOnPress())

    result.current(onClear)

    expect(mockScreenAddress).toHaveBeenCalledWith(undefined, expect.anything())
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
