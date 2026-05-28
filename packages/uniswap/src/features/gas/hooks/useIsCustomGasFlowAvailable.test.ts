import { renderHook } from '@testing-library/react'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useActiveWallet } from 'uniswap/src/features/accounts/store/hooks'
import { useIsCustomGasFlowAvailable } from 'uniswap/src/features/gas/hooks/useIsCustomGasFlowAvailable'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPlatformState = vi.hoisted(() => ({ isWebApp: false }))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebApp(): boolean {
      return mockPlatformState.isWebApp
    },
  }
})

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveWallet: vi.fn(),
}))

const mockedUseActiveWallet = vi.mocked(useActiveWallet)

const EW_WALLET = { id: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID } as never
const NON_EW_WALLET = { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS } as never

describe('useIsCustomGasFlowAvailable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPlatformState.isWebApp = false
    mockedUseActiveWallet.mockReturnValue(undefined)
  })

  it('returns true on mobile/extension regardless of active wallet', () => {
    mockPlatformState.isWebApp = false
    mockedUseActiveWallet.mockReturnValue(NON_EW_WALLET)
    const { result } = renderHook(() => useIsCustomGasFlowAvailable())
    expect(result.current).toBe(true)
  })

  it('returns true on mobile/extension when no wallet is connected', () => {
    mockPlatformState.isWebApp = false
    mockedUseActiveWallet.mockReturnValue(undefined)
    const { result } = renderHook(() => useIsCustomGasFlowAvailable())
    expect(result.current).toBe(true)
  })

  it('returns true on web when connected with an Embedded Wallet', () => {
    mockPlatformState.isWebApp = true
    mockedUseActiveWallet.mockReturnValue(EW_WALLET)
    const { result } = renderHook(() => useIsCustomGasFlowAvailable())
    expect(result.current).toBe(true)
    expect(mockedUseActiveWallet).toHaveBeenCalledWith(Platform.EVM)
  })

  it('returns false on web when connected with a non-Embedded Wallet', () => {
    mockPlatformState.isWebApp = true
    mockedUseActiveWallet.mockReturnValue(NON_EW_WALLET)
    const { result } = renderHook(() => useIsCustomGasFlowAvailable())
    expect(result.current).toBe(false)
  })

  it('returns false on web when no wallet is connected', () => {
    mockPlatformState.isWebApp = true
    mockedUseActiveWallet.mockReturnValue(undefined)
    const { result } = renderHook(() => useIsCustomGasFlowAvailable())
    expect(result.current).toBe(false)
  })
})
