import { act, renderHook } from '@testing-library/react'
import { VerifyWalletResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import {
  AuctionValidation,
  KycVerificationStatus,
  ValidationType,
  ZkPassportVerificationData,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { UniverseChainId } from '@universe/chains'
import { KycProvider } from 'uniswap/src/data/apiClients/dataApiService/auctions/useVerifyWallet'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionKycStatus } from '~/features/Toucan/Auction/hooks/useAuctionKycStatus'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockUseVerifyWalletQuery = vi.fn()

vi.mock('uniswap/src/data/apiClients/dataApiService/auctions/useVerifyWallet', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/auctions/useVerifyWallet')>()
  return {
    ...actual,
    useVerifyWalletQuery: (...args: unknown[]) => mockUseVerifyWalletQuery(...args),
  }
})

const mockUseZkPassportMint = vi.fn()

vi.mock('~/features/Toucan/ZkPassport/useZkPassportMint', () => ({
  useZkPassportMint: (...args: unknown[]) => mockUseZkPassportMint(...args),
}))

interface MockValidationParams {
  status?: KycVerificationStatus
  redirectUrl?: string
  hasKycVerification?: boolean
  hasPresale?: boolean
  isAllowlisted?: boolean
}

interface MockQueryResult {
  data: VerifyWalletResponse | undefined
  isLoading: boolean
  isError: boolean
}

function createMockQueryResult(overrides: {
  data?: MockValidationParams
  isLoading?: boolean
  isError?: boolean
}): MockQueryResult {
  const { data, isLoading = false, isError = false } = overrides
  return {
    data: data ? createMockResponse(data) : undefined,
    isLoading,
    isError,
  }
}

function createMockResponse(params: MockValidationParams): VerifyWalletResponse {
  const {
    status = KycVerificationStatus.VERIFICATION_STATUS_NOT_STARTED,
    redirectUrl = 'https://kyc.example.com',
    hasKycVerification = false,
    hasPresale = false,
    isAllowlisted = false,
  } = params

  const validations: AuctionValidation[] = []

  if (hasKycVerification) {
    validations.push({
      validationType: ValidationType.KYC_VERIFICATION,
      data: {
        value: {
          status,
          redirectUrl,
        },
      },
      validationPassed: status === KycVerificationStatus.VERIFICATION_STATUS_COMPLETED,
    } as unknown as AuctionValidation)
  }

  if (hasPresale) {
    validations.push({
      validationType: ValidationType.ERC_1155_GATEWAY,
      data: { value: {} },
      validationPassed: isAllowlisted,
    } as unknown as AuctionValidation)
  }

  return { validations } as VerifyWalletResponse
}

describe('useAuctionKycStatus', () => {
  const defaultParams = {
    walletAddress: '0x123',
    auctionAddress: '0xabc',
    chainId: UniverseChainId.Mainnet,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('returns loading state when query is loading', () => {
      mockUseVerifyWalletQuery.mockReturnValue(createMockQueryResult({ isLoading: true }))

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        auctionNeedsVerification: false,
        auctionHasPresale: false,
        isAllowlisted: false,
        canBid: false,
        kycButtonLabel: undefined,
        whitelistLabel: undefined,
        kycButtonDisabled: true,
        onKycAction: undefined,
        isLoading: true,
        isError: false,
        status: KycVerificationStatus.VERIFICATION_STATUS_UNSPECIFIED,
        hasNoRecognizedValidations: false,
      })
    })
  })

  describe('error state', () => {
    it('returns error state when query has error', () => {
      mockUseVerifyWalletQuery.mockReturnValue(createMockQueryResult({ isError: true }))

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        auctionNeedsVerification: false,
        auctionHasPresale: false,
        isAllowlisted: false,
        canBid: false,
        kycButtonLabel: undefined,
        whitelistLabel: undefined,
        kycButtonDisabled: true,
        onKycAction: undefined,
        isLoading: false,
        isError: true,
        status: KycVerificationStatus.VERIFICATION_STATUS_UNSPECIFIED,
        hasNoRecognizedValidations: false,
      })
    })

    it('returns error state when data is undefined', () => {
      mockUseVerifyWalletQuery.mockReturnValue(createMockQueryResult({ data: undefined }))

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        auctionNeedsVerification: false,
        auctionHasPresale: false,
        isAllowlisted: false,
        canBid: false,
        kycButtonLabel: undefined,
        whitelistLabel: undefined,
        kycButtonDisabled: true,
        onKycAction: undefined,
        isLoading: false,
        isError: true,
        status: KycVerificationStatus.VERIFICATION_STATUS_UNSPECIFIED,
        hasNoRecognizedValidations: false,
      })
    })
  })

  describe('no verification needed', () => {
    it('allows bidding when auction does not need verification', () => {
      mockUseVerifyWalletQuery.mockReturnValue(
        createMockQueryResult({
          data: {},
        }),
      )

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        auctionNeedsVerification: false,
        auctionHasPresale: false,
        isAllowlisted: false,
        canBid: true,
        whitelistLabel: undefined,
        kycButtonDisabled: false,
        onKycAction: undefined,
        isLoading: false,
        isError: false,
        // When no KYC validation exists, status is UNSPECIFIED
        status: KycVerificationStatus.VERIFICATION_STATUS_UNSPECIFIED,
        hasNoRecognizedValidations: true,
      })
    })
  })

  describe('verified status', () => {
    it('allows bidding when user is verified (non-presale)', () => {
      mockUseVerifyWalletQuery.mockReturnValue(
        createMockQueryResult({
          data: {
            status: KycVerificationStatus.VERIFICATION_STATUS_COMPLETED,
            hasPresale: false,
            hasKycVerification: true,
          },
        }),
      )

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        auctionNeedsVerification: true,
        kycProvider: KycProvider.Predicate,
        auctionHasPresale: false,
        isAllowlisted: false,
        canBid: true,
        kycButtonLabel: undefined,
        whitelistLabel: undefined,
        kycButtonDisabled: false,
        onKycAction: undefined,
        isLoading: false,
        isError: false,
        status: KycVerificationStatus.VERIFICATION_STATUS_COMPLETED,
        hasNoRecognizedValidations: false,
      })
    })

    it('allows bidding when user is verified AND allowlisted (presale)', () => {
      mockUseVerifyWalletQuery.mockReturnValue(
        createMockQueryResult({
          data: {
            status: KycVerificationStatus.VERIFICATION_STATUS_COMPLETED,
            hasPresale: true,
            hasKycVerification: true,
            isAllowlisted: true,
          },
        }),
      )

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        auctionNeedsVerification: true,
        kycProvider: KycProvider.Predicate,
        auctionHasPresale: true,
        isAllowlisted: true,
        canBid: true,
        kycButtonLabel: undefined,
        whitelistLabel: undefined,
        kycButtonDisabled: false,
        onKycAction: undefined,
        isLoading: false,
        isError: false,
        status: KycVerificationStatus.VERIFICATION_STATUS_COMPLETED,
        hasNoRecognizedValidations: false,
      })
    })

    it('blocks bidding when user is verified but NOT allowlisted (presale)', () => {
      mockUseVerifyWalletQuery.mockReturnValue(
        createMockQueryResult({
          data: {
            status: KycVerificationStatus.VERIFICATION_STATUS_COMPLETED,
            hasPresale: true,
            hasKycVerification: true,
            isAllowlisted: false,
          },
        }),
      )

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        auctionNeedsVerification: true,
        kycProvider: KycProvider.Predicate,
        auctionHasPresale: true,
        isAllowlisted: false,
        canBid: false,
        kycButtonLabel: undefined,
        whitelistLabel: 'toucan.kyc.generalSaleStartsSoon',
        kycButtonDisabled: true,
        onKycAction: undefined,
        isLoading: false,
        isError: false,
        status: KycVerificationStatus.VERIFICATION_STATUS_COMPLETED,
        hasNoRecognizedValidations: false,
      })
    })
  })

  describe('pending status', () => {
    it('shows verification in progress when status is PENDING', () => {
      mockUseVerifyWalletQuery.mockReturnValue(
        createMockQueryResult({
          data: { status: KycVerificationStatus.VERIFICATION_STATUS_PENDING, hasKycVerification: true },
        }),
      )

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        auctionNeedsVerification: true,
        kycProvider: KycProvider.Predicate,
        auctionHasPresale: false,
        isAllowlisted: false,
        canBid: false,
        kycButtonLabel: 'toucan.kyc.verificationInProgress',
        whitelistLabel: undefined,
        kycButtonDisabled: false,
        onKycAction: expect.any(Function),
        isLoading: false,
        isError: false,
        status: KycVerificationStatus.VERIFICATION_STATUS_PENDING,
        hasNoRecognizedValidations: false,
      })
    })
  })

  describe('retry', () => {
    it('shows retry when status is RETRY', () => {
      mockUseVerifyWalletQuery.mockReturnValue(
        createMockQueryResult({
          data: { status: KycVerificationStatus.VERIFICATION_STATUS_RETRY, hasKycVerification: true },
        }),
      )

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        auctionNeedsVerification: true,
        kycProvider: KycProvider.Predicate,
        auctionHasPresale: false,
        isAllowlisted: false,
        canBid: false,
        kycButtonLabel: 'toucan.kyc.verificationRetry',
        whitelistLabel: undefined,
        kycButtonDisabled: false,
        onKycAction: expect.any(Function),
        isLoading: false,
        isError: false,
        status: KycVerificationStatus.VERIFICATION_STATUS_RETRY,
        hasNoRecognizedValidations: false,
      })
    })
  })

  describe('failed verification', () => {
    it('disables bidding when verification fails', () => {
      mockUseVerifyWalletQuery.mockReturnValue(
        createMockQueryResult({
          data: { status: KycVerificationStatus.VERIFICATION_STATUS_REJECTED, hasKycVerification: true },
        }),
      )

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        auctionNeedsVerification: true,
        kycProvider: KycProvider.Predicate,
        auctionHasPresale: false,
        isAllowlisted: false,
        canBid: false,
        kycButtonLabel: 'toucan.kyc.verificationFailed',
        whitelistLabel: undefined,
        kycButtonDisabled: false,
        onKycAction: undefined,
        isLoading: false,
        isError: false,
        status: KycVerificationStatus.VERIFICATION_STATUS_REJECTED,
        hasNoRecognizedValidations: false,
      })
    })
  })

  describe('not started', () => {
    it('prompts user to verify identity when status is NOT_STARTED', () => {
      mockUseVerifyWalletQuery.mockReturnValue(
        createMockQueryResult({
          data: { status: KycVerificationStatus.VERIFICATION_STATUS_NOT_STARTED, hasKycVerification: true },
        }),
      )

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current.auctionNeedsVerification).toBe(true)
      expect(result.current.auctionHasPresale).toBe(false)
      expect(result.current.isAllowlisted).toBe(false)
      expect(result.current.canBid).toBe(false)
      expect(result.current.kycButtonLabel).toBe('toucan.kyc.verifyIdentity')
      expect(result.current.kycButtonDisabled).toBe(false)
      expect(result.current.onKycAction).toBeDefined()
    })

    it('onKycAction opens redirect URL in new tab', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

      mockUseVerifyWalletQuery.mockReturnValue(
        createMockQueryResult({
          data: {
            status: KycVerificationStatus.VERIFICATION_STATUS_NOT_STARTED,
            hasKycVerification: true,
            redirectUrl: 'https://kyc.predicate.io/verify',
          },
        }),
      )

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      result.current.onKycAction?.()

      expect(windowOpenSpy).toHaveBeenCalledWith('https://kyc.predicate.io/verify', '_blank')

      windowOpenSpy.mockRestore()
    })
  })

  describe('default - unknown status', () => {
    it('returns default state when status is COMPLETED', () => {
      mockUseVerifyWalletQuery.mockReturnValue(
        createMockQueryResult({
          // @ts-expect-error new or unknown status
          data: { status: 'UNKNOWN', hasKycVerification: true },
        }),
      )

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        canBid: true,
        kycButtonLabel: undefined,
        whitelistLabel: undefined,
        kycButtonDisabled: false,
        onKycAction: undefined,
        isLoading: false,
        isError: false,
        isAllowlisted: true,
        auctionHasPresale: false,
        auctionNeedsVerification: false,
        status: KycVerificationStatus.VERIFICATION_STATUS_COMPLETED,
        hasNoRecognizedValidations: false,
      })
    })
  })

  describe('hasNoRecognizedValidations', () => {
    it('is true only when the backend recognized nothing at all', () => {
      mockUseVerifyWalletQuery.mockReturnValue(createMockQueryResult({ data: {} }))
      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))
      expect(result.current.hasNoRecognizedValidations).toBe(true)
    })

    it('is false for a max-bid-price hook whose ceiling is DISABLED', () => {
      // The hook treats maxBidPrice() == 0 as "skip the check", so the backend serves the
      // entry with "0". The entry's presence means recognized; only its value says there is
      // no ceiling. If this collapsed to "recognized nothing", BidForm would flag the
      // auction unsupported and disable bidding on a perfectly valid launch.
      const ceilingDisabled = {
        validationType: 3,
        data: { case: 'maxBidPriceData', value: { maxBidPriceQ96: '0' } },
        validationPassed: true,
      } as unknown as AuctionValidation
      mockUseVerifyWalletQuery.mockReturnValue({
        data: { validations: [ceilingDisabled] } as VerifyWalletResponse,
        isLoading: false,
        isError: false,
      })

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))
      expect(result.current.hasNoRecognizedValidations).toBe(false)
      // The ceiling entry must not be mistaken for a KYC validation.
      expect(result.current.auctionNeedsVerification).toBe(false)
      // Deliberately NOT asserting canBid here: with no KYC entry the hook returns
      // canBid: true from its !auctionNeedsVerification branch regardless of how the
      // ceiling is treated, so it would pass either way. That the ceiling never acts as a
      // wallet gate is covered where it can actually fail — the canBid cases in
      // packages/uniswap/.../useVerifyWallet.test.ts.
    })

    it('is false while the query is still loading', () => {
      mockUseVerifyWalletQuery.mockReturnValue(createMockQueryResult({ isLoading: true }))
      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))
      expect(result.current.hasNoRecognizedValidations).toBe(false)
    })
  })

  describe('ZKPassport', () => {
    const POLICY_ID = `0x${'1'.padStart(64, '0')}`

    function mockZkPassportGate({ passed, policyId = POLICY_ID }: { passed: boolean; policyId?: string }): void {
      mockUseVerifyWalletQuery.mockReturnValue({
        data: {
          validations: [
            new AuctionValidation({
              validationType: ValidationType.ZKPASSPORT_VERIFICATION,
              validationPassed: passed,
              data: {
                case: 'zkPassportVerificationData',
                value: new ZkPassportVerificationData({
                  status: KycVerificationStatus.VERIFICATION_STATUS_NOT_STARTED,
                  policyId,
                }),
              },
            }),
          ],
        },
        isLoading: false,
        isError: false,
      })
    }

    it('asks for verification like any KYC, minting the credential instead of redirecting', () => {
      const mint = vi.fn()
      mockUseZkPassportMint.mockReturnValue(mint)
      mockZkPassportGate({ passed: false })

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current.kycProvider).toBe(KycProvider.ZkPassport)
      expect(result.current.auctionNeedsVerification).toBe(true)
      expect(result.current.canBid).toBe(false)
      expect(result.current.kycButtonLabel).toBe('toucan.kyc.verifyIdentity')
      expect(result.current.kycButtonDisabled).toBe(false)
      expect(mockUseZkPassportMint).toHaveBeenCalledWith(
        expect.objectContaining({ policyId: POLICY_ID, chainId: defaultParams.chainId }),
      )
      act(() => result.current.onKycAction?.())
      expect(mint).toHaveBeenCalledTimes(1)
    })

    it('polls for the credential only once the wallet opens ZKPassport', () => {
      mockUseZkPassportMint.mockReturnValue(vi.fn())
      mockZkPassportGate({ passed: false })

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(mockUseVerifyWalletQuery).toHaveBeenLastCalledWith(expect.anything(), {
        currentBlockNumber: undefined,
        awaitingZkPassportCredential: false,
      })
      act(() => result.current.onKycAction?.())
      expect(mockUseVerifyWalletQuery).toHaveBeenLastCalledWith(expect.anything(), {
        currentBlockNumber: undefined,
        awaitingZkPassportCredential: true,
      })
    })

    it('stops polling when the user switches to another wallet', () => {
      mockUseZkPassportMint.mockReturnValue(vi.fn())
      mockZkPassportGate({ passed: false })

      const { result, rerender } = renderHook((params: typeof defaultParams) => useAuctionKycStatus(params), {
        initialProps: defaultParams,
      })
      act(() => result.current.onKycAction?.())
      rerender({ ...defaultParams, walletAddress: '0x456' })

      expect(mockUseVerifyWalletQuery).toHaveBeenLastCalledWith(expect.anything(), {
        currentBlockNumber: undefined,
        awaitingZkPassportCredential: false,
      })
    })

    it('keeps the verify button disabled until ZKPassport can open', () => {
      mockUseZkPassportMint.mockReturnValue(undefined)
      mockZkPassportGate({ passed: false })

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current.kycButtonDisabled).toBe(true)
      expect(result.current.onKycAction).toBeUndefined()
    })

    it('offers nothing to mint for an auction never registered with the hook', () => {
      mockUseZkPassportMint.mockReturnValue(undefined)
      mockZkPassportGate({ passed: false, policyId: '' })

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(mockUseZkPassportMint).toHaveBeenCalledWith(expect.objectContaining({ policyId: undefined }))
      expect(result.current.canBid).toBe(false)
      expect(result.current.kycButtonDisabled).toBe(true)
    })

    it('lets a wallet holding the credential bid, reading as verified', () => {
      mockUseZkPassportMint.mockReturnValue(undefined)
      mockZkPassportGate({ passed: true })

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current.canBid).toBe(true)
      expect(result.current.status).toBe(KycVerificationStatus.VERIFICATION_STATUS_COMPLETED)
      expect(result.current.kycButtonLabel).toBeUndefined()
    })
  })
})
