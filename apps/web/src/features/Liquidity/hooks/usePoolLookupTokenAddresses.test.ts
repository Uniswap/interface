import { renderHook } from '@testing-library/react'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI, USDT } from 'uniswap/src/constants/tokens'
import { usePermissionedSwapPair } from 'uniswap/src/features/permissionedTokens/usePermissionedSwapPair'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePoolLookupTokenAddresses } from '~/features/Liquidity/hooks/usePoolLookupTokenAddresses'
import { ETH_MAINNET } from '~/test-utils/constants'

vi.mock('uniswap/src/features/permissionedTokens/usePermissionedSwapPair', () => ({
  usePermissionedSwapPair: vi.fn(),
}))

vi.mock('~/features/accounts/store/hooks', () => ({
  useActiveAddress: vi.fn(() => undefined),
}))

const NOT_PERMISSIONED = {
  isPermissioned: false,
  isAllowlisted: true,
  isLoading: false,
  kycUrl: undefined,
  issuer: undefined,
  inputAdapterAddress: undefined,
  outputAdapterAddress: undefined,
}

const ETH = ETH_MAINNET

describe('usePoolLookupTokenAddresses', () => {
  beforeEach(() => {
    vi.mocked(usePermissionedSwapPair).mockReturnValue(NOT_PERMISSIONED)
  })

  it('should pass through displayed addresses unchanged for non-permissioned pairs', () => {
    const { result } = renderHook(() => usePoolLookupTokenAddresses({ token0: DAI, token1: USDT }))

    expect(result.current.lookupAddress0).toBe(DAI.address)
    expect(result.current.lookupAddress1).toBe(USDT.address)
    expect(result.current.orientationFlipped).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('should map a native currency to the zero address', () => {
    const { result } = renderHook(() => usePoolLookupTokenAddresses({ token0: ETH, token1: USDT }))

    expect(result.current.lookupAddress0).toBe(ZERO_ADDRESS)
    expect(result.current.lookupAddress1).toBe(USDT.address)
  })

  it('should substitute the adapter address for the permissioned side', () => {
    const adapter = '0xef1dc9abd8a7e073cfdda453c775e7ce24e4a4c8'
    vi.mocked(usePermissionedSwapPair).mockReturnValue({
      ...NOT_PERMISSIONED,
      isPermissioned: true,
      outputAdapterAddress: adapter,
    })

    const { result } = renderHook(() => usePoolLookupTokenAddresses({ token0: ETH, token1: USDT }))

    expect(result.current.lookupAddress0).toBe(ZERO_ADDRESS)
    expect(result.current.lookupAddress1).toBe(adapter)
    expect(result.current.orientationFlipped).toBe(false)
  })

  it('should re-sort the pair when the adapter changes lexical order', () => {
    // DAI (0x6b17...) sorts before USDT (0xdac1...), but the adapter for the DAI side
    // sorts after USDT, so the mapped pair must swap.
    const adapter = '0xffffffffffffffffffffffffffffffffffffffff'
    vi.mocked(usePermissionedSwapPair).mockReturnValue({
      ...NOT_PERMISSIONED,
      isPermissioned: true,
      inputAdapterAddress: adapter,
    })

    const { result } = renderHook(() => usePoolLookupTokenAddresses({ token0: DAI, token1: USDT }))

    expect(result.current.lookupAddress0).toBe(USDT.address.toLowerCase())
    expect(result.current.lookupAddress1).toBe(adapter)
    expect(result.current.orientationFlipped).toBe(true)
  })

  it('should surface the permissions loading state', () => {
    vi.mocked(usePermissionedSwapPair).mockReturnValue({ ...NOT_PERMISSIONED, isLoading: true })

    const { result } = renderHook(() => usePoolLookupTokenAddresses({ token0: ETH, token1: USDT }))

    expect(result.current.isLoading).toBe(true)
  })
})
