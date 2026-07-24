import { useIsBlockedAddress } from '@universe/compliance'
import { AccountType } from 'uniswap/src/features/accounts/types'
import type { MockedFunction } from 'vitest'
import { useIsBlockedActiveAddress } from 'wallet/src/features/compliance/hooks'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { renderHook } from 'wallet/src/test/test-utils'

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccount: vi.fn(),
}))

// Keep the real `toScreenInput` so we exercise the hook's actual skip/screen logic;
// only stub the network-backed `useIsBlockedAddress`.
vi.mock('@universe/compliance', async () => ({
  ...(await vi.importActual('@universe/compliance')),
  useIsBlockedAddress: vi.fn(),
}))

const mockUseActiveAccount = useActiveAccount as MockedFunction<typeof useActiveAccount>
const mockUseIsBlockedAddress = useIsBlockedAddress as MockedFunction<typeof useIsBlockedAddress>

// Valid EVM addresses so the shared wallet provider mounted by `renderHook` doesn't
// reject them; the specific value only matters for the screened-address assertions.
const SIGNER_ADDRESS = '0x1111111111111111111111111111111111111111'
const READONLY_ADDRESS = '0x2222222222222222222222222222222222222222'
const NOT_BLOCKED = { isBlocked: false, isBlockedLoading: false }

describe('useIsBlockedActiveAddress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsBlockedAddress.mockReturnValue(NOT_BLOCKED)
  })

  it('screens a signer account by its address', () => {
    mockUseActiveAccount.mockReturnValue({ type: AccountType.SignerMnemonic, address: SIGNER_ADDRESS } as any)

    renderHook(() => useIsBlockedActiveAddress())

    expect(mockUseIsBlockedAddress).toHaveBeenCalledWith({ address: SIGNER_ADDRESS })
  })

  // The incident-critical fail-open path: view-only accounts are never screened.
  it('skips screening for a view-only (readonly) account', () => {
    mockUseActiveAccount.mockReturnValue({ type: AccountType.Readonly, address: READONLY_ADDRESS } as any)

    renderHook(() => useIsBlockedActiveAddress())

    expect(mockUseIsBlockedAddress).toHaveBeenCalledWith(undefined)
  })

  it('skips screening when there is no active account', () => {
    mockUseActiveAccount.mockReturnValue(null)

    renderHook(() => useIsBlockedActiveAddress())

    expect(mockUseIsBlockedAddress).toHaveBeenCalledWith(undefined)
  })

  it('skips screening when a signer account has no address', () => {
    mockUseActiveAccount.mockReturnValue({ type: AccountType.SignerMnemonic, address: '' } as any)

    renderHook(() => useIsBlockedActiveAddress())

    expect(mockUseIsBlockedAddress).toHaveBeenCalledWith(undefined)
  })

  it('passes through a blocked result', () => {
    mockUseActiveAccount.mockReturnValue({ type: AccountType.SignerMnemonic, address: SIGNER_ADDRESS } as any)
    mockUseIsBlockedAddress.mockReturnValue({ isBlocked: true, isBlockedLoading: false })

    const { result } = renderHook(() => useIsBlockedActiveAddress())

    expect(result.current).toEqual({ isBlocked: true, isBlockedLoading: false })
  })

  it('passes through the loading state', () => {
    mockUseActiveAccount.mockReturnValue({ type: AccountType.SignerMnemonic, address: SIGNER_ADDRESS } as any)
    mockUseIsBlockedAddress.mockReturnValue({ isBlocked: false, isBlockedLoading: true })

    const { result } = renderHook(() => useIsBlockedActiveAddress())

    expect(result.current).toEqual({ isBlocked: false, isBlockedLoading: true })
  })
})
