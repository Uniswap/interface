import { renderHook } from '@testing-library/react'
import { useTokenKYCStatus } from 'uniswap/src/features/permissionedTokens/useTokenKYCStatus'

// Mixed-case on purpose so the param-shape assertion exercises the hook's `.toLowerCase()` call.
const TOKEN_ADDRESS_INPUT = '0x0000000000000000000000000000000000534C4E'
const TOKEN_ADDRESS = '0x0000000000000000000000000000000000534c4e'
const MAINNET_CHAIN_ID = 1
const WALLET = '0x1234567890123456789012345678901234567890'
// Hook lowercases the unconnected-quote placeholder before sending.
const UNCONNECTED_ADDRESS_LOWER = '0xaaaa44272dc658575ba38f43c438447dded45358'

const { mockUseCheckPermissionsQuery, mockLoggerWarn } = vi.hoisted(() => ({
  mockUseCheckPermissionsQuery: vi.fn(),
  mockLoggerWarn: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/tradingApi/useCheckPermissionsQuery', () => ({
  useCheckPermissionsQuery: (...args: unknown[]) => mockUseCheckPermissionsQuery(...args),
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('useTokenKYCStatus', () => {
  beforeEach(() => {
    mockUseCheckPermissionsQuery.mockReset()
    mockLoggerWarn.mockReset()
    mockUseCheckPermissionsQuery.mockReturnValue({ data: undefined, isLoading: false })
  })

  it('fails open while the API has no data (loading or error)', () => {
    mockUseCheckPermissionsQuery.mockReturnValue({ data: undefined, isLoading: true })

    const { result } = renderHook(() =>
      useTokenKYCStatus({ tokenAddress: TOKEN_ADDRESS, chainId: MAINNET_CHAIN_ID, walletAddress: WALLET }),
    )

    expect(result.current.isPermissioned).toBe(false)
    expect(result.current.isAllowlisted).toBe(true)
    expect(result.current.isLoading).toBe(true)
  })

  it('reports isPermissioned=false when API explicitly says the token is not permissioned', () => {
    mockUseCheckPermissionsQuery.mockReturnValue({
      data: {
        requestId: 'r',
        results: [{ token: TOKEN_ADDRESS, isPermissioned: false }],
      },
      isLoading: false,
    })

    const { result } = renderHook(() =>
      useTokenKYCStatus({ tokenAddress: TOKEN_ADDRESS, chainId: MAINNET_CHAIN_ID, walletAddress: WALLET }),
    )

    expect(result.current.isPermissioned).toBe(false)
    expect(result.current.isAllowlisted).toBe(true)
    expect(result.current.kycUrl).toBeUndefined()
    expect(result.current.issuer).toBeUndefined()
  })

  it('reports isAllowlisted=false with kycUrl when API marks the wallet as not allowlisted', () => {
    mockUseCheckPermissionsQuery.mockReturnValue({
      data: {
        requestId: 'r',
        results: [
          {
            token: TOKEN_ADDRESS,
            isPermissioned: true,
            isAllowlisted: false,
            adapterTokenAddress: '0x0000000000000000000000000000000000000001',
            issuer: 'Superstate',
            kycUrl: 'https://example.test/kyc',
          },
        ],
      },
      isLoading: false,
    })

    const { result } = renderHook(() =>
      useTokenKYCStatus({ tokenAddress: TOKEN_ADDRESS, chainId: MAINNET_CHAIN_ID, walletAddress: WALLET }),
    )

    expect(result.current.isPermissioned).toBe(true)
    expect(result.current.isAllowlisted).toBe(false)
    expect(result.current.kycUrl).toBe('https://example.test/kyc')
    expect(result.current.issuer).toBe('Superstate')
  })

  it('reports isAllowlisted=true when API marks the wallet as allowlisted', () => {
    mockUseCheckPermissionsQuery.mockReturnValue({
      data: {
        requestId: 'r',
        results: [
          {
            token: TOKEN_ADDRESS,
            isPermissioned: true,
            isAllowlisted: true,
            adapterTokenAddress: '0x0000000000000000000000000000000000000001',
            issuer: 'Superstate',
          },
        ],
      },
      isLoading: false,
    })

    const { result } = renderHook(() =>
      useTokenKYCStatus({ tokenAddress: TOKEN_ADDRESS, chainId: MAINNET_CHAIN_ID, walletAddress: WALLET }),
    )

    expect(result.current.isPermissioned).toBe(true)
    expect(result.current.isAllowlisted).toBe(true)
    expect(result.current.kycUrl).toBeUndefined()
    expect(result.current.issuer).toBe('Superstate')
  })

  it('substitutes the unconnected placeholder and lowercases the token address when no wallet is connected', () => {
    mockUseCheckPermissionsQuery.mockReturnValue({ data: undefined, isLoading: false })

    renderHook(() =>
      useTokenKYCStatus({ tokenAddress: TOKEN_ADDRESS_INPUT, chainId: MAINNET_CHAIN_ID, walletAddress: undefined }),
    )

    expect(mockUseCheckPermissionsQuery).toHaveBeenCalledWith({
      params: {
        walletAddress: UNCONNECTED_ADDRESS_LOWER,
        tokens: [TOKEN_ADDRESS],
        chainId: MAINNET_CHAIN_ID,
      },
    })
  })

  it('overrides isAllowlisted to true pre-wallet so connect-wallet UX takes over from the verify CTA', () => {
    mockUseCheckPermissionsQuery.mockReturnValue({
      data: {
        requestId: 'r',
        results: [
          {
            token: TOKEN_ADDRESS,
            isPermissioned: true,
            isAllowlisted: false,
            adapterTokenAddress: '0x0000000000000000000000000000000000000001',
            issuer: 'Superstate',
            kycUrl: 'https://example.test/kyc',
          },
        ],
      },
      isLoading: false,
    })

    const { result } = renderHook(() =>
      useTokenKYCStatus({ tokenAddress: TOKEN_ADDRESS, chainId: MAINNET_CHAIN_ID, walletAddress: undefined }),
    )

    expect(result.current.isPermissioned).toBe(true)
    expect(result.current.isAllowlisted).toBe(true)
    expect(result.current.kycUrl).toBeUndefined()
    expect(result.current.issuer).toBe('Superstate')
  })

  it('does not fire the API when tokenAddress is missing', () => {
    renderHook(() => useTokenKYCStatus({ tokenAddress: undefined, chainId: MAINNET_CHAIN_ID, walletAddress: WALLET }))

    expect(mockUseCheckPermissionsQuery).toHaveBeenCalledWith({ params: undefined })
  })

  it('does not fire the API when chainId is missing', () => {
    renderHook(() => useTokenKYCStatus({ tokenAddress: TOKEN_ADDRESS, chainId: undefined, walletAddress: WALLET }))

    expect(mockUseCheckPermissionsQuery).toHaveBeenCalledWith({ params: undefined })
  })

  it('fails open when the API errors (queryFn handles logging)', () => {
    // The hook itself no longer logs on render; useCheckPermissionsQuery.queryFn
    // captures the error once via logger.warn at the network boundary.
    const err = new Error('upstream 500')
    mockUseCheckPermissionsQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: err })

    const { result } = renderHook(() =>
      useTokenKYCStatus({ tokenAddress: TOKEN_ADDRESS, chainId: MAINNET_CHAIN_ID, walletAddress: WALLET }),
    )

    expect(result.current.isPermissioned).toBe(false)
    expect(result.current.isAllowlisted).toBe(true)
    expect(mockLoggerWarn).not.toHaveBeenCalled()
  })

  it('returns the default (non-permissioned) state when the API responds with an empty results array', () => {
    // BE returned a successful response but no row for this token. Hook falls back to the
    // non-permissioned default and does not log a warning (only network/protocol errors
    // are loggable).
    mockUseCheckPermissionsQuery.mockReturnValue({
      data: { requestId: 'r', results: [] },
      isLoading: false,
    })

    const { result } = renderHook(() =>
      useTokenKYCStatus({ tokenAddress: TOKEN_ADDRESS, chainId: MAINNET_CHAIN_ID, walletAddress: WALLET }),
    )

    expect(result.current.isPermissioned).toBe(false)
    expect(result.current.isAllowlisted).toBe(true)
    expect(result.current.kycUrl).toBeUndefined()
    expect(result.current.issuer).toBeUndefined()
    expect(mockLoggerWarn).not.toHaveBeenCalled()
  })
})
