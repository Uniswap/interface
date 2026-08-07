import { renderHook } from '@testing-library/react'
import { useIsPermissionedSendBlocked } from 'uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked'
import type { PermissionedTokenStatus } from 'uniswap/src/features/permissionedTokens/useTokenKYCStatus'

const TOKEN_ADDRESS = '0x0000000000000000000000000000000000534c4e'
const MAINNET_CHAIN_ID = 1
const SENDER = '0x1111111111111111111111111111111111111111'
const RECIPIENT = '0x2222222222222222222222222222222222222222'

const { mockUseTokenKYCStatus } = vi.hoisted(() => ({
  mockUseTokenKYCStatus: vi.fn(),
}))

vi.mock('uniswap/src/features/permissionedTokens/useTokenKYCStatus', () => ({
  useTokenKYCStatus: (...args: unknown[]) => mockUseTokenKYCStatus(...args),
}))

const status = (overrides: Partial<PermissionedTokenStatus> = {}): PermissionedTokenStatus => ({
  isPermissioned: false,
  isAllowlisted: true,
  isLoading: false,
  ...overrides,
})

const permissionedCurrency = {
  isNative: false,
  address: TOKEN_ADDRESS,
  chainId: MAINNET_CHAIN_ID,
  symbol: 'SLINK',
  decimals: 18,
} as never

const nativeCurrency = {
  isNative: true,
  chainId: MAINNET_CHAIN_ID,
  symbol: 'ETH',
  decimals: 18,
} as never

/**
 * The hook calls useTokenKYCStatus twice: once keyed on the sender (to learn isPermissioned)
 * and once keyed on the recipient (to learn the recipient's allowlist status). Route the mock
 * by the walletAddress arg so each call returns its own status.
 */
function mockKYCByWallet(byWallet: { sender: PermissionedTokenStatus; recipient: PermissionedTokenStatus }): void {
  mockUseTokenKYCStatus.mockImplementation((args: { walletAddress?: string }) => {
    return args.walletAddress === RECIPIENT ? byWallet.recipient : byWallet.sender
  })
}

describe('useIsPermissionedSendBlocked', () => {
  beforeEach(() => {
    mockUseTokenKYCStatus.mockReset()
    mockUseTokenKYCStatus.mockReturnValue(status())
  })

  it('does not block a native-token send', () => {
    mockUseTokenKYCStatus.mockReturnValue(status({ isPermissioned: false }))

    const { result } = renderHook(() =>
      useIsPermissionedSendBlocked({
        sendCurrency: nativeCurrency,
        senderAddress: SENDER,
        recipientAddress: RECIPIENT,
      }),
    )

    expect(result.current.isPermissionedSendBlocked).toBe(false)
    expect(result.current.isPermissionedSendBlockedLoading).toBe(false)
  })

  it('does not block when the token is not permissioned', () => {
    mockUseTokenKYCStatus.mockReturnValue(status({ isPermissioned: false }))

    const { result } = renderHook(() =>
      useIsPermissionedSendBlocked({
        sendCurrency: permissionedCurrency,
        senderAddress: SENDER,
        recipientAddress: RECIPIENT,
      }),
    )

    expect(result.current.isPermissionedSendBlocked).toBe(false)
  })

  it('blocks when the token is permissioned and the recipient is not allowlisted', () => {
    mockKYCByWallet({
      sender: status({ isPermissioned: true, isAllowlisted: true }),
      recipient: status({ isPermissioned: true, isAllowlisted: false }),
    })

    const { result } = renderHook(() =>
      useIsPermissionedSendBlocked({
        sendCurrency: permissionedCurrency,
        senderAddress: SENDER,
        recipientAddress: RECIPIENT,
      }),
    )

    expect(result.current.isPermissionedSendBlocked).toBe(true)
    expect(result.current.permissionedSendBlockReason).toBe('recipient')
  })

  it('blocks with reason "sender" when the holder is no longer allowlisted, even to an allowlisted recipient', () => {
    // The decoupled state: the holder was allowlisted when they received the token, then got
    // removed. Any transfer now reverts on the sender check, regardless of the recipient.
    mockKYCByWallet({
      sender: status({ isPermissioned: true, isAllowlisted: false }),
      recipient: status({ isPermissioned: true, isAllowlisted: true }),
    })

    const { result } = renderHook(() =>
      useIsPermissionedSendBlocked({
        sendCurrency: permissionedCurrency,
        senderAddress: SENDER,
        recipientAddress: RECIPIENT,
      }),
    )

    expect(result.current.isPermissionedSendBlocked).toBe(true)
    expect(result.current.permissionedSendBlockReason).toBe('sender')
  })

  it('does not block when the token is permissioned and the recipient is allowlisted', () => {
    mockKYCByWallet({
      sender: status({ isPermissioned: true, isAllowlisted: true }),
      recipient: status({ isPermissioned: true, isAllowlisted: true }),
    })

    const { result } = renderHook(() =>
      useIsPermissionedSendBlocked({
        sendCurrency: permissionedCurrency,
        senderAddress: SENDER,
        recipientAddress: RECIPIENT,
      }),
    )

    expect(result.current.isPermissionedSendBlocked).toBe(false)
  })

  it('does not block a self-send when the sender is allowlisted', () => {
    // The common self-send case: an allowlisted holder moving the token to themselves. The
    // recipient check is skipped (recipient === sender), and the sender is allowlisted, so no block.
    mockUseTokenKYCStatus.mockReturnValue(status({ isPermissioned: true, isAllowlisted: true }))

    const { result } = renderHook(() =>
      useIsPermissionedSendBlocked({
        sendCurrency: permissionedCurrency,
        senderAddress: SENDER,
        recipientAddress: SENDER,
      }),
    )

    expect(result.current.isPermissionedSendBlocked).toBe(false)
    expect(result.current.permissionedSendBlockReason).toBeUndefined()
  })

  it('blocks a self-send when the sender is no longer allowlisted', () => {
    // A de-allowlisted holder can't even self-send: the sender side of the AllowList check reverts.
    mockUseTokenKYCStatus.mockReturnValue(status({ isPermissioned: true, isAllowlisted: false }))

    const { result } = renderHook(() =>
      useIsPermissionedSendBlocked({
        sendCurrency: permissionedCurrency,
        senderAddress: SENDER,
        recipientAddress: SENDER,
      }),
    )

    expect(result.current.isPermissionedSendBlocked).toBe(true)
    expect(result.current.permissionedSendBlockReason).toBe('sender')
  })

  it('does not block when no recipient has been entered yet', () => {
    mockUseTokenKYCStatus.mockReturnValue(status({ isPermissioned: true, isAllowlisted: true }))

    const { result } = renderHook(() =>
      useIsPermissionedSendBlocked({
        sendCurrency: permissionedCurrency,
        senderAddress: SENDER,
        recipientAddress: undefined,
      }),
    )

    expect(result.current.isPermissionedSendBlocked).toBe(false)
  })

  it('reports loading (without blocking) while the recipient allowlist check is in flight', () => {
    mockKYCByWallet({
      sender: status({ isPermissioned: true, isAllowlisted: true }),
      recipient: status({ isPermissioned: true, isAllowlisted: true, isLoading: true }),
    })

    const { result } = renderHook(() =>
      useIsPermissionedSendBlocked({
        sendCurrency: permissionedCurrency,
        senderAddress: SENDER,
        recipientAddress: RECIPIENT,
      }),
    )

    expect(result.current.isPermissionedSendBlocked).toBe(false)
    expect(result.current.isPermissionedSendBlockedLoading).toBe(true)
  })
})
