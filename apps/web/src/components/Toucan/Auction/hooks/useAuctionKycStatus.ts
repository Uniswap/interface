import { ChainId, KycVerificationStatus } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toLegacyVerifyWalletResponse, useVerifyWalletQuery } from 'uniswap/src/data/rest/auctions/useVerifyWallet'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface UseAuctionKycStatusParams {
  walletAddress?: string
  auctionAddress?: string
  chainId?: UniverseChainId
}

export interface AuctionKycStatus {
  /** Whether user is allowed to proceed to bid review */
  canBid: boolean
  /** Override button label for KYC states (undefined = use default) */
  kycButtonLabel?: string
  /** Label shown when user is not whitelisted for presale (undefined = no label) */
  whitelistLabel?: string
  /** Whether button should be disabled due to KYC */
  kycButtonDisabled: boolean
  /** Action to take when button is clicked in non-bidable KYC state */
  onKycAction: (() => void) | undefined
  /** Whether KYC data is still loading */
  isLoading: boolean
  /** Whether there was an error fetching KYC status */
  isError: boolean
  /** Whether user is on the allowlist */
  isAllowlisted: boolean
  /** Whether auction has presale requiring whitelist */
  auctionHasPresale: boolean
  /** Whether auction needs verification */
  auctionNeedsVerification: boolean
  /** The current status of the KYC verification */
  status: KycVerificationStatus
}

export function useAuctionKycStatus({
  walletAddress,
  auctionAddress,
  chainId,
}: UseAuctionKycStatusParams): AuctionKycStatus {
  const { t } = useTranslation()
  const isToucanAuctionKYCEnabled = useFeatureFlag(FeatureFlags.ToucanAuctionKYC)
  const { data, isLoading, isError } = useVerifyWalletQuery({
    walletAddress,
    auctionAddress,
    chainId: chainId as unknown as ChainId,
  })

  const legacyData = useMemo(() => {
    if (data?.validations) {
      return toLegacyVerifyWalletResponse(data.validations)
    }
    return undefined
  }, [data?.validations])

  const redirectToKyc = useCallback(() => {
    if (legacyData?.redirectUrl) {
      window.open(legacyData.redirectUrl, '_blank')
    }
  }, [legacyData?.redirectUrl])

  return useMemo(() => {
    if (!isToucanAuctionKYCEnabled) {
      return {
        canBid: true,
        whitelistLabel: undefined,
        kycButtonDisabled: false,
        onKycAction: undefined,
        isLoading: false,
        isError: false,
        isAllowlisted: false,
        auctionHasPresale: false,
        auctionNeedsVerification: false,
        status: KycVerificationStatus.VERIFICATION_STATUS_UNSPECIFIED,
      }
    }

    // Still loading
    if (isLoading) {
      return {
        canBid: false,
        whitelistLabel: undefined,
        kycButtonDisabled: true,
        onKycAction: undefined,
        isLoading: true,
        isError: false,
        isAllowlisted: false,
        auctionHasPresale: false,
        auctionNeedsVerification: false,
        status: KycVerificationStatus.VERIFICATION_STATUS_UNSPECIFIED,
      }
    }

    // Error fetching
    if (isError || !legacyData) {
      return {
        canBid: false,
        whitelistLabel: undefined,
        kycButtonDisabled: true,
        onKycAction: undefined,
        isLoading: false,
        isError: true,
        isAllowlisted: false,
        auctionHasPresale: false,
        auctionNeedsVerification: false,
        status: KycVerificationStatus.VERIFICATION_STATUS_UNSPECIFIED,
      }
    }

    const { isAllowlisted, hasPresale: auctionHasPresale, hasKycVerification: auctionNeedsVerification } = legacyData

    // Compute whitelistLabel once - shown when presale is active but user is not whitelisted
    const whitelistLabel = auctionHasPresale && !isAllowlisted ? t('toucan.kyc.generalSaleStartsSoon') : undefined

    // No verification needed for this auction
    if (!auctionNeedsVerification) {
      return {
        canBid: true,
        whitelistLabel,
        kycButtonDisabled: false,
        onKycAction: undefined,
        isLoading: false,
        isError: false,
        isAllowlisted,
        auctionHasPresale,
        auctionNeedsVerification,
        status: legacyData.status,
      }
    }

    // Use the pre-computed canBid from the polyfill (all validations passed)
    if (legacyData.canBid) {
      return {
        canBid: true,
        whitelistLabel,
        kycButtonDisabled: false,
        onKycAction: undefined,
        isLoading: false,
        isError: false,
        isAllowlisted,
        auctionHasPresale,
        auctionNeedsVerification,
        status: legacyData.status,
      }
    }

    // KYC pending
    if (legacyData.status === KycVerificationStatus.VERIFICATION_STATUS_PENDING) {
      return {
        canBid: false,
        kycButtonLabel: t('toucan.kyc.verificationInProgress'),
        whitelistLabel,
        kycButtonDisabled: false,
        onKycAction: redirectToKyc,
        isLoading: false,
        isError: false,
        isAllowlisted,
        auctionHasPresale,
        auctionNeedsVerification,
        status: legacyData.status,
      }
    }

    // KYC needs retry
    if (legacyData.status === KycVerificationStatus.VERIFICATION_STATUS_RETRY) {
      return {
        canBid: false,
        kycButtonLabel: t('toucan.kyc.verificationRetry'),
        whitelistLabel,
        kycButtonDisabled: false,
        onKycAction: redirectToKyc,
        isLoading: false,
        isError: false,
        isAllowlisted,
        auctionHasPresale,
        auctionNeedsVerification,
        status: legacyData.status,
      }
    }

    // Verification failed
    if (legacyData.status === KycVerificationStatus.VERIFICATION_STATUS_REJECTED) {
      return {
        canBid: false,
        kycButtonLabel: t('toucan.kyc.verificationFailed'),
        whitelistLabel,
        kycButtonDisabled: false,
        onKycAction: undefined,
        isLoading: false,
        isError: false,
        isAllowlisted,
        auctionHasPresale,
        auctionNeedsVerification,
        status: legacyData.status,
      }
    }

    if (legacyData.status === KycVerificationStatus.VERIFICATION_STATUS_NOT_STARTED) {
      return {
        canBid: false,
        kycButtonLabel: t('toucan.kyc.verifyIdentity'),
        whitelistLabel,
        kycButtonDisabled: false,
        onKycAction: redirectToKyc,
        isLoading: false,
        isError: false,
        isAllowlisted,
        auctionHasPresale,
        auctionNeedsVerification,
        status: legacyData.status,
      }
    }

    // Not allowlisted
    if (auctionHasPresale && !isAllowlisted) {
      return {
        canBid: false,
        whitelistLabel,
        kycButtonDisabled: true,
        onKycAction: undefined,
        isLoading: false,
        isError: false,
        isAllowlisted,
        auctionHasPresale,
        auctionNeedsVerification,
        status: legacyData.status,
      }
    }

    // Default to bid
    return {
      canBid: true,
      whitelistLabel,
      kycButtonDisabled: false,
      onKycAction: undefined,
      isLoading: false,
      isError: false,
      isAllowlisted: true,
      auctionHasPresale: false,
      auctionNeedsVerification: false,
      status: KycVerificationStatus.VERIFICATION_STATUS_COMPLETED,
    }
  }, [legacyData, isLoading, isError, t, isToucanAuctionKYCEnabled, redirectToKyc])
}
