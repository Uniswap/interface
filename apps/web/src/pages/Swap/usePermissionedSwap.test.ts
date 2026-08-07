import { renderHook } from '@testing-library/react'
import type { CurrencyState } from '~/features/Swap/state/types'
import { usePermissionedSwap } from '~/pages/Swap/usePermissionedSwap'

const { mockUseAccount, mockUsePermissionedSwapPair } = vi.hoisted(() => ({
  mockUseAccount: vi.fn(),
  mockUsePermissionedSwapPair: vi.fn(),
}))

vi.mock('~/hooks/useAccount', () => ({
  useAccount: mockUseAccount,
}))

vi.mock('uniswap/src/features/permissionedTokens/usePermissionedSwapPair', () => ({
  usePermissionedSwapPair: mockUsePermissionedSwapPair,
}))

const PERMISSIONED_ADDRESS = '0x0000000000000000000000000000000000534c4e'
const NON_PERMISSIONED_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const REGISTRATION_URL = 'https://superstate.com/register'
const WALLET_ADDRESS = '0xWallet'

const permissionedCurrency = {
  isNative: false,
  address: PERMISSIONED_ADDRESS,
  chainId: 1,
  symbol: 'SLINK',
} as never

const nonPermissionedCurrency = {
  isNative: false,
  address: NON_PERMISSIONED_ADDRESS,
  chainId: 1,
  symbol: 'USDC',
} as never

const makeState = (input: unknown, output: unknown): CurrencyState =>
  ({ inputCurrency: input, outputCurrency: output }) as CurrencyState

const mockPairResult = (overrides: Partial<ReturnType<typeof mockUsePermissionedSwapPair>> = {}) => ({
  permissionedSide: 'input' as const,
  permissionedAddress: PERMISSIONED_ADDRESS,
  permissionedChainId: 1,
  permissionedSymbol: 'SLINK',
  isPermissioned: true,
  isAllowlisted: false,
  isLoading: false,
  kycUrl: REGISTRATION_URL,
  issuer: 'Superstate',
  ...overrides,
})

describe('usePermissionedSwap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAccount.mockReturnValue({ address: WALLET_ADDRESS })
    mockUsePermissionedSwapPair.mockReturnValue(mockPairResult())
  })

  describe('isPermissionedBlocked predicate', () => {
    it('permissioned + wallet + not allowlisted → blocked', () => {
      const { result } = renderHook(() => usePermissionedSwap(makeState(permissionedCurrency, nonPermissionedCurrency)))

      expect(result.current.isPermissioned).toBe(true)
      expect(result.current.walletConnected).toBe(true)
      expect(result.current.isAllowlisted).toBe(false)
      expect(result.current.isPermissionedBlocked).toBe(true)
    })

    it('permissioned + wallet + allowlisted → not blocked', () => {
      mockUsePermissionedSwapPair.mockReturnValue(mockPairResult({ isAllowlisted: true, kycUrl: undefined }))

      const { result } = renderHook(() => usePermissionedSwap(makeState(permissionedCurrency, nonPermissionedCurrency)))

      expect(result.current.isPermissioned).toBe(true)
      expect(result.current.isPermissionedBlocked).toBe(false)
    })

    it('permissioned + no wallet → not blocked (connect-wallet UX takes over)', () => {
      mockUseAccount.mockReturnValue({ address: undefined })
      // Pair hook overrides isAllowlisted=true when no wallet so consumers don't render block UI.
      mockUsePermissionedSwapPair.mockReturnValue(mockPairResult({ isAllowlisted: true, kycUrl: undefined }))

      const { result } = renderHook(() => usePermissionedSwap(makeState(permissionedCurrency, nonPermissionedCurrency)))

      expect(result.current.isPermissioned).toBe(true)
      expect(result.current.walletConnected).toBe(false)
      expect(result.current.isPermissionedBlocked).toBe(false)
    })

    it('not permissioned → never blocked', () => {
      mockUsePermissionedSwapPair.mockReturnValue(
        mockPairResult({
          permissionedSide: undefined,
          permissionedAddress: undefined,
          permissionedChainId: undefined,
          permissionedSymbol: undefined,
          isPermissioned: false,
          isAllowlisted: true,
          kycUrl: undefined,
          issuer: undefined,
        }),
      )

      const { result } = renderHook(() =>
        usePermissionedSwap(makeState(nonPermissionedCurrency, nonPermissionedCurrency)),
      )

      expect(result.current.isPermissioned).toBe(false)
      expect(result.current.isPermissionedBlocked).toBe(false)
    })

    it('permissioned + wallet + not allowlisted + missing kycUrl → not blocked (no URL to open)', () => {
      // VerifyIdentityModal has nothing to open without a kycUrl, so the gate stays off
      // even though the other three conditions are met.
      mockUsePermissionedSwapPair.mockReturnValue(mockPairResult({ kycUrl: undefined }))

      const { result } = renderHook(() => usePermissionedSwap(makeState(permissionedCurrency, nonPermissionedCurrency)))

      expect(result.current.isPermissioned).toBe(true)
      expect(result.current.walletConnected).toBe(true)
      expect(result.current.isAllowlisted).toBe(false)
      expect(result.current.isPermissionedBlocked).toBe(false)
    })
  })

  describe('hook delegation', () => {
    it('forwards both currencies and the wallet address to usePermissionedSwapPair', () => {
      renderHook(() => usePermissionedSwap(makeState(permissionedCurrency, nonPermissionedCurrency)))

      expect(mockUsePermissionedSwapPair).toHaveBeenCalledWith({
        inputCurrency: permissionedCurrency,
        outputCurrency: nonPermissionedCurrency,
        walletAddress: WALLET_ADDRESS,
      })
    })

    it('exposes the permissioned token symbol from the pair-check result', () => {
      const { result } = renderHook(() => usePermissionedSwap(makeState(permissionedCurrency, nonPermissionedCurrency)))

      expect(result.current.permissionedTokenSymbol).toBe('SLINK')
    })
  })
})
