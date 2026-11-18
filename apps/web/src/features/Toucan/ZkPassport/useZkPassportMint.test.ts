import { renderHook, waitFor } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useZkPassportMint } from '~/features/Toucan/ZkPassport/useZkPassportMint'

const verify = vi.fn()
const dispose = vi.fn()
const createVerification = vi.fn(() => ({ verify, dispose, close: vi.fn(), state: {} }))

vi.mock('@zkpassport/ui/button', () => ({ createVerification }))

const PARAMS = {
  policyId: `0x${'1'.padStart(64, '0')}`,
  chainId: UniverseChainId.Sepolia,
  walletAddress: '0x1234567890123456789012345678901234567891',
  onSettled: vi.fn(),
}

describe('useZkPassportMint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reuses one ZKPassport controller across clicks, so a second click refocuses the popup', async () => {
    const { result } = renderHook(() => useZkPassportMint(PARAMS))
    await waitFor(() => expect(result.current).toBeDefined())

    result.current?.()
    result.current?.()

    expect(createVerification).toHaveBeenCalledTimes(1)
    expect(verify).toHaveBeenCalledTimes(2)
  })

  it('disposes the controller on unmount', async () => {
    const { result, unmount } = renderHook(() => useZkPassportMint(PARAMS))
    await waitFor(() => expect(result.current).toBeDefined())

    unmount()

    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('opens nothing without a wallet to mint to', () => {
    const { result } = renderHook(() => useZkPassportMint({ ...PARAMS, walletAddress: undefined }))
    expect(result.current).toBeUndefined()
  })
})
