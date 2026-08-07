import { renderHook } from '@testing-library/react'
import type { Currency } from '@uniswap/sdk-core'
import { useLPPermissionedGating } from '~/features/Liquidity/usePermissionedLP'

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

const REGISTRATION_URL = 'https://superstate.com/register'

// Partial Currency fixtures: the hook only reads chainId/isNative/address/symbol. Anchoring
// to Currency (not `never`) so the test fails if the hook starts reading something else.
const tokenInput = {
  isNative: false,
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  chainId: 1,
  symbol: 'USDC',
} as unknown as Currency

const tokenOutput = {
  isNative: true,
  chainId: 1,
  symbol: 'ETH',
} as unknown as Currency

describe('useLPPermissionedGating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAccount.mockReturnValue({ address: '0xWallet' })
  })

  it('flags permissioned + not allowlisted when API marks the pair as permissioned and the wallet is not allowlisted', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      permissionedSide: 'input',
      permissionedAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      permissionedChainId: 1,
      permissionedSymbol: 'USDC',
      isPermissioned: true,
      isAllowlisted: false,
      isLoading: false,
      kycUrl: REGISTRATION_URL,
      issuer: 'Superstate',
    })

    const { result } = renderHook(() => useLPPermissionedGating({ token0: tokenInput, token1: tokenOutput }))

    expect(result.current.isPermissioned).toBe(true)
    expect(result.current.isPermissionedAndNotAllowlisted).toBe(true)
    expect(result.current.permissionedTokenSymbol).toBe('USDC')
    expect(result.current.permissionedConfig?.registrationUrl).toBe(REGISTRATION_URL)
  })

  it('returns isPermissionedAndNotAllowlisted false when allowlisted', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      permissionedSide: 'input',
      permissionedAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      permissionedChainId: 1,
      permissionedSymbol: 'USDC',
      isPermissioned: true,
      isAllowlisted: true,
      isLoading: false,
      kycUrl: undefined,
      issuer: 'Superstate',
    })

    const { result } = renderHook(() => useLPPermissionedGating({ token0: tokenInput, token1: tokenOutput }))

    expect(result.current.isPermissioned).toBe(true)
    expect(result.current.isAllowlisted).toBe(true)
    expect(result.current.isPermissionedAndNotAllowlisted).toBe(false)
  })

  it('returns no gating when neither side is permissioned per API', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      permissionedSide: undefined,
      permissionedAddress: undefined,
      permissionedChainId: undefined,
      permissionedSymbol: undefined,
      isPermissioned: false,
      isAllowlisted: true,
      isLoading: false,
      kycUrl: undefined,
      issuer: undefined,
    })

    const { result } = renderHook(() => useLPPermissionedGating({ token0: tokenOutput, token1: tokenOutput }))

    expect(result.current.isPermissioned).toBe(false)
    expect(result.current.isPermissionedAndNotAllowlisted).toBe(false)
    expect(result.current.permissionedTokenSymbol).toBeUndefined()
    expect(result.current.permissionedConfig).toBeUndefined()
  })
})
