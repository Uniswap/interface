import { renderHook } from '@testing-library/react'
import { useDappSwapPermissionedBlock } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/useDappSwapPermissionedBlock'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useTokenKYCStatus } from 'uniswap/src/features/permissionedTokens/useTokenKYCStatus'

vi.mock('uniswap/src/features/permissionedTokens/useTokenKYCStatus', () => ({
  useTokenKYCStatus: vi.fn(),
}))

const mockUseTokenKYCStatus = vi.mocked(useTokenKYCStatus)

const PERMISSIONED_ADDRESS = '0xb73055db2b3a3eae87a331dd88e4a80b43602690'
const REGULAR_ADDRESS = '0x1f46ea239595706960a9208897968b169db1b89c'
const WALLET_ADDRESS = '0x1111111111111111111111111111111111111111'
const KYC_URL = 'https://app.superstate.com'

function makeCurrencyInfo({
  address,
  symbol,
  isNative = false,
}: {
  address: string
  symbol: string
  isNative?: boolean
}): CurrencyInfo {
  return {
    currency: { isNative, address, symbol, chainId: 11155111 },
  } as unknown as CurrencyInfo
}

const OPEN_STATUS = { isPermissioned: false, isAllowlisted: true, isLoading: false }
const ALLOWLISTED_STATUS = { isPermissioned: true, isAllowlisted: true, isLoading: false }
const DENIED_STATUS = { isPermissioned: true, isAllowlisted: false, isLoading: false, kycUrl: KYC_URL }

// Routes mock results by the tokenAddress each useTokenKYCStatus call receives.
function mockStatusByToken(statusByAddress: Record<string, ReturnType<typeof useTokenKYCStatus>>): void {
  mockUseTokenKYCStatus.mockImplementation(({ tokenAddress }: { tokenAddress: string | undefined }) => {
    if (tokenAddress && statusByAddress[tokenAddress]) {
      return statusByAddress[tokenAddress]
    }
    return OPEN_STATUS
  })
}

describe('useDappSwapPermissionedBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not block when neither token is permissioned', () => {
    mockStatusByToken({})

    const { result } = renderHook(() =>
      useDappSwapPermissionedBlock({
        inputCurrencyInfo: makeCurrencyInfo({ address: REGULAR_ADDRESS, symbol: 'mUSDC' }),
        outputCurrencyInfo: makeCurrencyInfo({ address: REGULAR_ADDRESS, symbol: 'mUSDC' }),
        walletAddress: WALLET_ADDRESS,
      }),
    )

    expect(result.current.isBlocked).toBe(false)
  })

  it('should not block when the permissioned token wallet is allowlisted', () => {
    mockStatusByToken({ [PERMISSIONED_ADDRESS]: ALLOWLISTED_STATUS })

    const { result } = renderHook(() =>
      useDappSwapPermissionedBlock({
        inputCurrencyInfo: makeCurrencyInfo({ address: REGULAR_ADDRESS, symbol: 'mUSDC' }),
        outputCurrencyInfo: makeCurrencyInfo({ address: PERMISSIONED_ADDRESS, symbol: 'PTOK2' }),
        walletAddress: WALLET_ADDRESS,
      }),
    )

    expect(result.current.isBlocked).toBe(false)
  })

  it('should block with the output symbol and kycUrl when buying a permissioned token while not allowlisted', () => {
    mockStatusByToken({ [PERMISSIONED_ADDRESS]: DENIED_STATUS })

    const { result } = renderHook(() =>
      useDappSwapPermissionedBlock({
        inputCurrencyInfo: makeCurrencyInfo({ address: REGULAR_ADDRESS, symbol: 'mUSDC' }),
        outputCurrencyInfo: makeCurrencyInfo({ address: PERMISSIONED_ADDRESS, symbol: 'PTOK2' }),
        walletAddress: WALLET_ADDRESS,
      }),
    )

    expect(result.current).toEqual({ isBlocked: true, blockedSymbol: 'PTOK2', kycUrl: KYC_URL })
  })

  it('should block with the input symbol when selling a permissioned token while not allowlisted', () => {
    mockStatusByToken({ [PERMISSIONED_ADDRESS]: DENIED_STATUS })

    const { result } = renderHook(() =>
      useDappSwapPermissionedBlock({
        inputCurrencyInfo: makeCurrencyInfo({ address: PERMISSIONED_ADDRESS, symbol: 'PTOK2' }),
        outputCurrencyInfo: makeCurrencyInfo({ address: REGULAR_ADDRESS, symbol: 'mUSDC' }),
        walletAddress: WALLET_ADDRESS,
      }),
    )

    expect(result.current).toEqual({ isBlocked: true, blockedSymbol: 'PTOK2', kycUrl: KYC_URL })
  })

  it('should skip the KYC check entirely for native currency legs', () => {
    mockStatusByToken({})

    renderHook(() =>
      useDappSwapPermissionedBlock({
        inputCurrencyInfo: makeCurrencyInfo({ address: PERMISSIONED_ADDRESS, symbol: 'ETH', isNative: true }),
        outputCurrencyInfo: makeCurrencyInfo({ address: REGULAR_ADDRESS, symbol: 'mUSDC' }),
        walletAddress: WALLET_ADDRESS,
      }),
    )

    const nativeLegCall = mockUseTokenKYCStatus.mock.calls[0]?.[0]
    expect(nativeLegCall).toEqual(expect.objectContaining({ tokenAddress: undefined, chainId: undefined }))
  })

  it('should not block while the check is loading (fails open like the user-initiated surface)', () => {
    mockStatusByToken({
      [PERMISSIONED_ADDRESS]: { isPermissioned: false, isAllowlisted: true, isLoading: true },
    })

    const { result } = renderHook(() =>
      useDappSwapPermissionedBlock({
        inputCurrencyInfo: makeCurrencyInfo({ address: REGULAR_ADDRESS, symbol: 'mUSDC' }),
        outputCurrencyInfo: makeCurrencyInfo({ address: PERMISSIONED_ADDRESS, symbol: 'PTOK2' }),
        walletAddress: WALLET_ADDRESS,
      }),
    )

    expect(result.current.isBlocked).toBe(false)
  })

  it('keys the KYC check on the passed walletAddress (the dapp-request account, not the active one)', () => {
    mockStatusByToken({ [PERMISSIONED_ADDRESS]: DENIED_STATUS })
    const DAPP_REQUEST_ADDRESS = '0x2222222222222222222222222222222222222222'

    renderHook(() =>
      useDappSwapPermissionedBlock({
        inputCurrencyInfo: makeCurrencyInfo({ address: REGULAR_ADDRESS, symbol: 'mUSDC' }),
        outputCurrencyInfo: makeCurrencyInfo({ address: PERMISSIONED_ADDRESS, symbol: 'PTOK2' }),
        walletAddress: DAPP_REQUEST_ADDRESS,
      }),
    )

    // Every KYC lookup must be keyed on the account the request signs with, never a global active account.
    for (const call of mockUseTokenKYCStatus.mock.calls) {
      expect(call[0]).toEqual(expect.objectContaining({ walletAddress: DAPP_REQUEST_ADDRESS }))
    }
  })
})
