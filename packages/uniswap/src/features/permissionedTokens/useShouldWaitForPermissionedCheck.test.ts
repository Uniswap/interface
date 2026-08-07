import { renderHook } from '@testing-library/react'
import type { PermissionedSwapPairResult } from 'uniswap/src/features/permissionedTokens/usePermissionedSwapPair'
import { useShouldWaitForPermissionedCheck } from 'uniswap/src/features/permissionedTokens/useShouldWaitForPermissionedCheck'

const { mockUsePermissionedSwapPair } = vi.hoisted(() => ({
  mockUsePermissionedSwapPair: vi.fn(),
}))

vi.mock('uniswap/src/features/permissionedTokens/usePermissionedSwapPair', () => ({
  usePermissionedSwapPair: mockUsePermissionedSwapPair,
}))

const NON_PERMISSIONED_CURRENCY = {
  chainId: 1,
  isNative: false,
  address: '0x1f46ea239595706960a9208897968b169db1b89c',
  symbol: 'mUSDC',
} as unknown as Parameters<typeof useShouldWaitForPermissionedCheck>[0]['inputCurrency']

function mockResult(partial: Partial<PermissionedSwapPairResult>): void {
  mockUsePermissionedSwapPair.mockReturnValue({
    isPermissioned: false,
    isAllowlisted: true,
    isLoading: false,
    ...partial,
  } as PermissionedSwapPairResult)
}

describe('useShouldWaitForPermissionedCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true while the permissioned check is loading (quote must wait)', () => {
    mockResult({ isLoading: true })

    const { result } = renderHook(() =>
      useShouldWaitForPermissionedCheck({
        inputCurrency: NON_PERMISSIONED_CURRENCY,
        outputCurrency: undefined,
        walletAddress: '0x1111111111111111111111111111111111111111',
      }),
    )

    expect(result.current).toBe(true)
  })

  it('returns false once the check has resolved (quote may fire)', () => {
    mockResult({ isLoading: false, isPermissioned: true, isAllowlisted: true })

    const { result } = renderHook(() =>
      useShouldWaitForPermissionedCheck({
        inputCurrency: NON_PERMISSIONED_CURRENCY,
        outputCurrency: undefined,
        walletAddress: '0x1111111111111111111111111111111111111111',
      }),
    )

    expect(result.current).toBe(false)
  })

  it('does not wait for pairs the query treats as non-checkable (isLoading=false)', () => {
    // usePermissionedSwapPair disables its query (isLoading=false) when there is no checkable
    // token, so a non-permissioned-eligible pair is never gated.
    mockResult({ isLoading: false })

    const { result } = renderHook(() =>
      useShouldWaitForPermissionedCheck({
        inputCurrency: undefined,
        outputCurrency: undefined,
        walletAddress: undefined,
      }),
    )

    expect(result.current).toBe(false)
  })
})
