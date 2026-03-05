import { PartialMessage } from '@bufbuild/protobuf'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import {
  VerifyWalletRequest,
  VerifyWalletResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import {
  AuctionValidation,
  Erc1155GateData,
  KycVerificationStatus,
  PredicateKycVerificationData,
  ValidationType,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { AuctionMutationClient } from 'uniswap/src/data/apiClients/liquidityService/AuctionMutationClient'
import { AUCTION_DEFAULT_RETRY, AuctionStaleTime } from 'uniswap/src/data/rest/auctions/queryTypes'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * Hook to verify a wallet's KYC status for an auction.
 *
 * Automatically polls when status is PENDING (every 15 seconds).
 * Disabled when walletAddress, auctionAddress, or chainId is not provided.
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useVerifyWalletQuery({
 *   walletAddress: account?.address,
 *   auctionAddress: auction?.contractAddress,
 *   chainId: auction?.chainId,
 * })
 *
 * if (data?.status === VerificationStatus.COMPLETED) {
 *   // User can bid
 * }
 * ```
 */
export function useVerifyWalletQuery(
  params: PartialMessage<VerifyWalletRequest>,
): UseQueryResult<VerifyWalletResponse, Error> {
  const featureFlagEnabled = useFeatureFlag(FeatureFlags.ToucanAuctionKYC)
  const enabled = Boolean(params.walletAddress && params.auctionAddress && params.chainId) && featureFlagEnabled

  return useQuery({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'verifyWallet', params],
    queryFn: () => {
      return AuctionMutationClient.verifyWallet({
        ...params,
      })
    },
    enabled,
    staleTime: AuctionStaleTime.FAST,
    retry: AUCTION_DEFAULT_RETRY,
    refetchInterval: (query) => {
      const kycValidation = query.state.data?.validations.find(isKycValidation)
      const status = kycValidation?.data.value?.status
      if (status === KycVerificationStatus.VERIFICATION_STATUS_PENDING) {
        return PollingInterval.Fast
      }
      return false
    },
  })
}

export function isKycValidation(v: AuctionValidation): v is AuctionValidation & {
  data: { value: PredicateKycVerificationData | undefined }
} {
  return v.validationType === ValidationType.KYC_VERIFICATION
}

export function isAllowlistedValidation(v: AuctionValidation): v is AuctionValidation & {
  data: { value: Erc1155GateData | undefined }
} {
  return v.validationType === ValidationType.ERC_1155_GATEWAY
}

/**
 * Legacy response shape for backwards compatibility with useAuctionKycStatus
 */
export interface LegacyVerifyWalletResponse {
  status: KycVerificationStatus
  redirectUrl?: string
  qrCode?: string
  isAllowlisted: boolean
  hasPresale: boolean
  hasKycVerification: boolean
  canBid: boolean
}

/**
 * Transforms the new AuctionValidation[] response to the legacy flat structure
 * used by useAuctionKycStatus for backwards compatibility.
 */
export function toLegacyVerifyWalletResponse(validations: AuctionValidation[]): LegacyVerifyWalletResponse {
  const kycValidation = validations.find(isKycValidation)
  const presaleValidation = validations.find(isAllowlistedValidation)

  const kycData = kycValidation?.data.value
  const hasKycVerification = !!kycValidation
  const hasPresale = !!presaleValidation

  // All validations must pass to bid
  const canBid = validations.length > 0 && validations.every((v) => v.validationPassed)

  let status = kycData?.status
  if (status === KycVerificationStatus.VERIFICATION_STATUS_UNSPECIFIED) {
    status = KycVerificationStatus.VERIFICATION_STATUS_NOT_STARTED
  }

  return {
    status: status ?? KycVerificationStatus.VERIFICATION_STATUS_UNSPECIFIED,
    redirectUrl: kycData?.redirectUrl,
    qrCode: kycData?.qrCode,
    isAllowlisted: presaleValidation?.validationPassed ?? false,
    hasPresale,
    hasKycVerification,
    canBid,
  }
}
