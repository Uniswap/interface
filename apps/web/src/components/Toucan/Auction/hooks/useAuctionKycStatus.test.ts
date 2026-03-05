import { renderHook } from '@testing-library/react'
import { VerifyWalletResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import {
  AuctionValidation,
  KycVerificationStatus,
  ValidationType,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionKycStatus } from '~/components/Toucan/Auction/hooks/useAuctionKycStatus'
import { mocked } from '~/test-utils/mocked'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@universe/gating', () => ({
  useFeatureFlag: vi.fn(),
  FeatureFlags: {
    ToucanAuctionKYC: 'toucan_auction_kyc',
  },
}))

const mockUseVerifyWalletQuery = vi.fn()

vi.mock('uniswap/src/data/rest/auctions/useVerifyWallet', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/data/rest/auctions/useVerifyWallet')>()
  return {
    ...actual,
    useVerifyWalletQuery: (...args: unknown[]) => mockUseVerifyWalletQuery(...args),
  }
})

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
      mocked(useFeatureFlag).mockReturnValue(true)
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
      })
    })
  })

  describe('error state', () => {
    it('returns error state when query has error', () => {
      mocked(useFeatureFlag).mockReturnValue(true)
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
      })
    })

    it('returns error state when data is undefined', () => {
      mocked(useFeatureFlag).mockReturnValue(true)
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
      })
    })
  })

  describe('no verification needed', () => {
    it('allows bidding when auction does not need verification', () => {
      mocked(useFeatureFlag).mockReturnValue(true)
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
      })
    })
  })

  describe('verified status', () => {
    it('allows bidding when user is verified (non-presale)', () => {
      mocked(useFeatureFlag).mockReturnValue(true)
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
      })
    })

    it('allows bidding when user is verified AND allowlisted (presale)', () => {
      mocked(useFeatureFlag).mockReturnValue(true)
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
      })
    })

    it('blocks bidding when user is verified but NOT allowlisted (presale)', () => {
      mocked(useFeatureFlag).mockReturnValue(true)
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
      })
    })
  })

  describe('pending status', () => {
    it('shows verification in progress when status is PENDING', () => {
      mocked(useFeatureFlag).mockReturnValue(true)
      mockUseVerifyWalletQuery.mockReturnValue(
        createMockQueryResult({
          data: { status: KycVerificationStatus.VERIFICATION_STATUS_PENDING, hasKycVerification: true },
        }),
      )

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        auctionNeedsVerification: true,
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
      })
    })
  })

  describe('retry', () => {
    it('shows retry when status is RETRY', () => {
      mocked(useFeatureFlag).mockReturnValue(true)
      mockUseVerifyWalletQuery.mockReturnValue(
        createMockQueryResult({
          data: { status: KycVerificationStatus.VERIFICATION_STATUS_RETRY, hasKycVerification: true },
        }),
      )

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        auctionNeedsVerification: true,
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
      })
    })
  })

  describe('failed verification', () => {
    it('disables bidding when verification fails', () => {
      mocked(useFeatureFlag).mockReturnValue(true)
      mockUseVerifyWalletQuery.mockReturnValue(
        createMockQueryResult({
          data: { status: KycVerificationStatus.VERIFICATION_STATUS_REJECTED, hasKycVerification: true },
        }),
      )

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        auctionNeedsVerification: true,
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
      })
    })
  })

  describe('not started', () => {
    it('prompts user to verify identity when status is NOT_STARTED', () => {
      mocked(useFeatureFlag).mockReturnValue(true)
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

      mocked(useFeatureFlag).mockReturnValue(true)
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
      mocked(useFeatureFlag).mockReturnValue(true)
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
      })
    })
  })

  describe('feature flag disabled', () => {
    it('returns default state when feature flag is disabled', () => {
      mocked(useFeatureFlag).mockReturnValue(false)
      mockUseVerifyWalletQuery.mockReturnValue(createMockQueryResult({}))

      const { result } = renderHook(() => useAuctionKycStatus(defaultParams))

      expect(result.current).toEqual({
        canBid: true,
        kycButtonLabel: undefined,
        whitelistLabel: undefined,
        kycButtonDisabled: false,
        onKycAction: undefined,
        isLoading: false,
        isError: false,
        isAllowlisted: false,
        auctionHasPresale: false,
        auctionNeedsVerification: false,
        status: KycVerificationStatus.VERIFICATION_STATUS_UNSPECIFIED,
      })
    })
  })
})
