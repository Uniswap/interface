import { renderHook } from '@testing-library/react'
import { usePermissionedSwapPair } from 'uniswap/src/features/permissionedTokens/usePermissionedSwapPair'

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

const PERMISSIONED_INPUT = '0x7B7C6A29368eEbe78BFab9eAE09d958Da5cAD9a4'
const PERMISSIONED_OUTPUT = '0x0000000000000000000000000000000000534c4e'
const NON_PERMISSIONED = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WALLET = '0xaaaaBBBBccccDDDDeeeeFFFF000011112222Aaaa'
const KYC_URL = 'https://example.test/kyc'
const ETHEREUM = 1
const SEPOLIA = 11155111

// UNCONNECTED_ADDRESS lowercased (constant in buildQuoteRequest.ts).
const UNCONNECTED_LOWER = '0xaaaa44272dc658575ba38f43c438447dded45358'

const erc20 = (
  address: string,
  chainId = ETHEREUM,
  symbol = 'TPT2',
): { chainId: number; isNative: false; address: string; symbol: string } => ({
  chainId,
  isNative: false,
  address,
  symbol,
})

const native = (chainId = ETHEREUM): { chainId: number; isNative: true; symbol: string } => ({
  chainId,
  isNative: true,
  symbol: 'ETH',
})

const apiResp = (
  results: Array<Record<string, unknown>>,
): { data: { requestId: string; results: unknown[] }; isLoading: boolean; isError: boolean; error: undefined } => ({
  data: { requestId: 'r', results },
  isLoading: false,
  isError: false,
  error: undefined,
})

describe('usePermissionedSwapPair', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCheckPermissionsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: undefined,
    })
  })

  describe('request shape', () => {
    it('does not call the API when neither side has an ERC-20 address', () => {
      renderHook(() =>
        usePermissionedSwapPair({ inputCurrency: native(), outputCurrency: native(), walletAddress: WALLET }),
      )

      expect(mockUseCheckPermissionsQuery).toHaveBeenCalledWith({ params: undefined })
    })

    it('sends lowercased addresses and the wallet to the API', () => {
      renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT),
          outputCurrency: erc20(NON_PERMISSIONED),
          walletAddress: WALLET,
        }),
      )

      expect(mockUseCheckPermissionsQuery).toHaveBeenCalledWith({
        params: {
          walletAddress: WALLET.toLowerCase(),
          tokens: [PERMISSIONED_INPUT.toLowerCase(), NON_PERMISSIONED.toLowerCase()],
          chainId: ETHEREUM,
        },
      })
    })

    it('substitutes the unconnected placeholder when no wallet is connected', () => {
      renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT),
          outputCurrency: undefined,
          walletAddress: undefined,
        }),
      )

      expect(mockUseCheckPermissionsQuery).toHaveBeenCalledWith({
        params: {
          walletAddress: UNCONNECTED_LOWER,
          tokens: [PERMISSIONED_INPUT.toLowerCase()],
          chainId: ETHEREUM,
        },
      })
    })

    it('skips the API call and fails open when the two sides are on different chains', () => {
      // Cross-chain pair: API only accepts one chainId per request, so we can't reliably
      // verify both sides. Hook skips the query (params=undefined) and returns the empty
      // result rather than risk a wrong-chain misclassification.
      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT, SEPOLIA, 'TPT2'),
          outputCurrency: erc20(NON_PERMISSIONED, ETHEREUM, 'USDC'),
          walletAddress: WALLET,
        }),
      )

      expect(mockUseCheckPermissionsQuery).toHaveBeenCalledWith({ params: undefined })
      expect(result.current.isPermissioned).toBe(false)
      expect(result.current.isAllowlisted).toBe(true)
      expect(result.current.permissionedSide).toBeUndefined()
    })
  })

  describe('empty/loading/error', () => {
    it('returns the empty result with isLoading=true when the API has no data yet', () => {
      mockUseCheckPermissionsQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: undefined,
      })

      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT),
          outputCurrency: erc20(NON_PERMISSIONED),
          walletAddress: WALLET,
        }),
      )

      expect(result.current).toEqual({
        permissionedSide: undefined,
        permissionedAddress: undefined,
        permissionedChainId: undefined,
        permissionedSymbol: undefined,
        isPermissioned: false,
        isAllowlisted: true,
        isLoading: true,
        kycUrl: undefined,
        issuer: undefined,
      })
    })

    it('fails open when the API errors (queryFn handles logging)', () => {
      // The hook itself no longer logs on render; useCheckPermissionsQuery.queryFn
      // captures the error once via logger.warn at the network boundary.
      const err = new Error('boom')
      mockUseCheckPermissionsQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: err })

      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT),
          outputCurrency: erc20(NON_PERMISSIONED),
          walletAddress: WALLET,
        }),
      )

      expect(result.current.isPermissioned).toBe(false)
      expect(result.current.isAllowlisted).toBe(true)
      expect(mockLoggerWarn).not.toHaveBeenCalled()
    })

    it('returns the empty result when neither side is permissioned in the response', () => {
      mockUseCheckPermissionsQuery.mockReturnValue(
        apiResp([
          { token: PERMISSIONED_INPUT, isPermissioned: false },
          { token: NON_PERMISSIONED, isPermissioned: false },
        ]),
      )

      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT),
          outputCurrency: erc20(NON_PERMISSIONED),
          walletAddress: WALLET,
        }),
      )

      expect(result.current.isPermissioned).toBe(false)
      expect(result.current.permissionedSide).toBeUndefined()
    })
  })

  describe('permissioned-side resolution', () => {
    it('resolves the input side when only input is permissioned', () => {
      mockUseCheckPermissionsQuery.mockReturnValue(
        apiResp([
          {
            token: PERMISSIONED_INPUT,
            isPermissioned: true,
            isAllowlisted: false,
            issuer: 'TestIssuer',
            kycUrl: KYC_URL,
          },
          { token: NON_PERMISSIONED, isPermissioned: false },
        ]),
      )

      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT, ETHEREUM, 'TPT2'),
          outputCurrency: erc20(NON_PERMISSIONED, ETHEREUM, 'USDC'),
          walletAddress: WALLET,
        }),
      )

      expect(result.current.permissionedSide).toBe('input')
      expect(result.current.permissionedAddress).toBe(PERMISSIONED_INPUT.toLowerCase())
      expect(result.current.permissionedSymbol).toBe('TPT2')
      expect(result.current.permissionedChainId).toBe(ETHEREUM)
      expect(result.current.isPermissioned).toBe(true)
      expect(result.current.isAllowlisted).toBe(false)
      expect(result.current.kycUrl).toBe(KYC_URL)
      expect(result.current.issuer).toBe('TestIssuer')
    })

    it('resolves the output side when only output is permissioned', () => {
      mockUseCheckPermissionsQuery.mockReturnValue(
        apiResp([
          { token: NON_PERMISSIONED, isPermissioned: false },
          {
            token: PERMISSIONED_OUTPUT,
            isPermissioned: true,
            isAllowlisted: false,
            issuer: 'Superstate',
            kycUrl: KYC_URL,
          },
        ]),
      )

      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(NON_PERMISSIONED, ETHEREUM, 'USDC'),
          outputCurrency: erc20(PERMISSIONED_OUTPUT, ETHEREUM, 'SLINK'),
          walletAddress: WALLET,
        }),
      )

      expect(result.current.permissionedSide).toBe('output')
      expect(result.current.permissionedAddress).toBe(PERMISSIONED_OUTPUT.toLowerCase())
      expect(result.current.permissionedSymbol).toBe('SLINK')
      expect(result.current.isPermissioned).toBe(true)
    })

    it('prefers the input side when both sides are permissioned and equally blocked', () => {
      mockUseCheckPermissionsQuery.mockReturnValue(
        apiResp([
          {
            token: PERMISSIONED_INPUT,
            isPermissioned: true,
            isAllowlisted: false,
            issuer: 'Issuer1',
            kycUrl: 'https://a.test',
          },
          {
            token: PERMISSIONED_OUTPUT,
            isPermissioned: true,
            isAllowlisted: false,
            issuer: 'Issuer2',
            kycUrl: 'https://b.test',
          },
        ]),
      )

      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT, ETHEREUM, 'TPT2'),
          outputCurrency: erc20(PERMISSIONED_OUTPUT, ETHEREUM, 'SLINK'),
          walletAddress: WALLET,
        }),
      )

      expect(result.current.permissionedSide).toBe('input')
      expect(result.current.permissionedSymbol).toBe('TPT2')
      expect(result.current.issuer).toBe('Issuer1')
      expect(result.current.kycUrl).toBe('https://a.test')
    })

    it('prefers the input side when both sides are permissioned and equally allowlisted', () => {
      mockUseCheckPermissionsQuery.mockReturnValue(
        apiResp([
          {
            token: PERMISSIONED_INPUT,
            isPermissioned: true,
            isAllowlisted: true,
            issuer: 'Issuer1',
          },
          {
            token: PERMISSIONED_OUTPUT,
            isPermissioned: true,
            isAllowlisted: true,
            issuer: 'Issuer2',
          },
        ]),
      )

      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT, ETHEREUM, 'TPT2'),
          outputCurrency: erc20(PERMISSIONED_OUTPUT, ETHEREUM, 'SLINK'),
          walletAddress: WALLET,
        }),
      )

      expect(result.current.permissionedSide).toBe('input')
      expect(result.current.permissionedSymbol).toBe('TPT2')
      expect(result.current.isAllowlisted).toBe(true)
    })

    it('prefers the blocked side when one side is permissioned+blocked and the other is permissioned+allowlisted', () => {
      mockUseCheckPermissionsQuery.mockReturnValue(
        apiResp([
          {
            token: PERMISSIONED_INPUT,
            isPermissioned: true,
            isAllowlisted: true,
            issuer: 'Issuer1',
          },
          {
            token: PERMISSIONED_OUTPUT,
            isPermissioned: true,
            isAllowlisted: false,
            issuer: 'Issuer2',
            kycUrl: 'https://b.test',
          },
        ]),
      )

      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT, ETHEREUM, 'TPT2'),
          outputCurrency: erc20(PERMISSIONED_OUTPUT, ETHEREUM, 'SLINK'),
          walletAddress: WALLET,
        }),
      )

      expect(result.current.permissionedSide).toBe('output')
      expect(result.current.permissionedSymbol).toBe('SLINK')
      expect(result.current.isAllowlisted).toBe(false)
      expect(result.current.kycUrl).toBe('https://b.test')
    })

    it('resolves the permissioned side when input is native and output is permissioned', () => {
      mockUseCheckPermissionsQuery.mockReturnValue(
        apiResp([
          {
            token: PERMISSIONED_OUTPUT,
            isPermissioned: true,
            isAllowlisted: false,
            issuer: 'Superstate',
            kycUrl: KYC_URL,
          },
        ]),
      )

      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: native(),
          outputCurrency: erc20(PERMISSIONED_OUTPUT, ETHEREUM, 'SLINK'),
          walletAddress: WALLET,
        }),
      )

      expect(result.current.permissionedSide).toBe('output')
      expect(result.current.isPermissioned).toBe(true)
      expect(mockUseCheckPermissionsQuery).toHaveBeenCalledWith({
        params: { walletAddress: WALLET.toLowerCase(), tokens: [PERMISSIONED_OUTPUT.toLowerCase()], chainId: ETHEREUM },
      })
    })
  })

  describe('adapter-address threading', () => {
    const INPUT_ADAPTER = '0xeF1dC9ABD8A7E073CFDDA453C775e7cE24e4A4C8'
    const OUTPUT_ADAPTER = '0x721c18B87340C11cd148624c6C5aaD2A95AA6168'

    it('returns the adapter address for every permissioned side, not just the surfaced one', () => {
      mockUseCheckPermissionsQuery.mockReturnValue(
        apiResp([
          {
            token: PERMISSIONED_INPUT,
            isPermissioned: true,
            isAllowlisted: true,
            issuer: 'Issuer1',
            adapterTokenAddress: INPUT_ADAPTER,
          },
          {
            token: PERMISSIONED_OUTPUT,
            isPermissioned: true,
            isAllowlisted: true,
            issuer: 'Issuer2',
            adapterTokenAddress: OUTPUT_ADAPTER,
          },
        ]),
      )

      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT, ETHEREUM, 'TPT2'),
          outputCurrency: erc20(PERMISSIONED_OUTPUT, ETHEREUM, 'SLINK'),
          walletAddress: WALLET,
        }),
      )

      // pickPermissionedSide surfaces input, but both adapters are still exposed.
      expect(result.current.permissionedSide).toBe('input')
      expect(result.current.inputAdapterAddress).toBe(INPUT_ADAPTER)
      expect(result.current.outputAdapterAddress).toBe(OUTPUT_ADAPTER)
    })

    it('leaves the non-permissioned side adapter undefined', () => {
      mockUseCheckPermissionsQuery.mockReturnValue(
        apiResp([
          {
            token: PERMISSIONED_INPUT,
            isPermissioned: true,
            isAllowlisted: true,
            issuer: 'Issuer1',
            adapterTokenAddress: INPUT_ADAPTER,
          },
          { token: NON_PERMISSIONED, isPermissioned: false },
        ]),
      )

      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT, ETHEREUM, 'TPT2'),
          outputCurrency: erc20(NON_PERMISSIONED, ETHEREUM, 'USDC'),
          walletAddress: WALLET,
        }),
      )

      expect(result.current.inputAdapterAddress).toBe(INPUT_ADAPTER)
      expect(result.current.outputAdapterAddress).toBeUndefined()
    })
  })

  describe('allowlist resolution', () => {
    it('reports isAllowlisted=true and clears kycUrl when wallet is allowlisted', () => {
      mockUseCheckPermissionsQuery.mockReturnValue(
        apiResp([{ token: PERMISSIONED_INPUT, isPermissioned: true, isAllowlisted: true, issuer: 'TestIssuer' }]),
      )

      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT),
          outputCurrency: native(),
          walletAddress: WALLET,
        }),
      )

      expect(result.current.isPermissioned).toBe(true)
      expect(result.current.isAllowlisted).toBe(true)
      expect(result.current.kycUrl).toBeUndefined()
    })

    it('overrides isAllowlisted=true and clears kycUrl when no wallet is connected (pre-wallet override)', () => {
      mockUseCheckPermissionsQuery.mockReturnValue(
        apiResp([
          {
            token: PERMISSIONED_INPUT,
            isPermissioned: true,
            isAllowlisted: false,
            issuer: 'TestIssuer',
            kycUrl: KYC_URL,
          },
        ]),
      )

      const { result } = renderHook(() =>
        usePermissionedSwapPair({
          inputCurrency: erc20(PERMISSIONED_INPUT),
          outputCurrency: native(),
          walletAddress: undefined,
        }),
      )

      expect(result.current.isPermissioned).toBe(true)
      expect(result.current.isAllowlisted).toBe(true)
      expect(result.current.kycUrl).toBeUndefined()
      expect(result.current.issuer).toBe('TestIssuer')
    })
  })
})
