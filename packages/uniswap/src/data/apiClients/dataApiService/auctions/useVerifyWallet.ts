import { PartialMessage } from '@bufbuild/protobuf'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import {
  VerifyWalletRequest,
  VerifyWalletResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import {
  AuctionValidation,
  ChainId,
  Erc1155GateData,
  KycVerificationStatus,
  MaxBidPriceData,
  PredicateKycVerificationData,
  ValidationType,
  ZkPassportVerificationData,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { useEffect } from 'react'
import { PollingInterval, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { AUCTION_DEFAULT_RETRY, AuctionStaleTime } from 'uniswap/src/data/apiClients/dataApiService/auctions/queryTypes'
import { AuctionQueryClient } from 'uniswap/src/data/apiClients/liquidityService/AuctionQueryClient'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * The VerifyWallet request params, built in one place.
 *
 * The ENTIRE params object is the react-query key, so two call sites share a cache entry
 * only if their params match field for field. Both the KYC status hook and the max-bid-price
 * hook subscribe per auction page; if either added or renamed a field independently they
 * would silently issue a second VerifyWallet request per page view. Going through this
 * builder makes that coupling enforced rather than documented.
 */
export function buildVerifyWalletParams({
  walletAddress,
  auctionAddress,
  chainId,
}: {
  walletAddress?: string
  auctionAddress?: string
  chainId?: number
}): PartialMessage<VerifyWalletRequest> {
  return {
    // The ceiling and the auction's gating requirements are properties of the auction, not
    // of the visitor, so the query still runs (and shares its key) when nobody is connected.
    walletAddress: walletAddress ?? ZERO_ADDRESS,
    auctionAddress,
    chainId: chainId as unknown as ChainId,
  }
}

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
  {
    currentBlockNumber,
    awaitingZkPassportCredential = false,
  }: {
    /** Refetches once the presale allowlist expires at this block */
    currentBlockNumber?: number
    /**
     * The wallet opened ZKPassport to mint a credential. Polls until the credential shows up; without it nothing
     * polls for a ZKPassport gate, since every wallet without the credential (the zero address too) fails it.
     */
    awaitingZkPassportCredential?: boolean
  } = {},
): UseQueryResult<VerifyWalletResponse, Error> {
  const enabled = Boolean(params.walletAddress && params.auctionAddress && params.chainId)

  const verifyWalletQuery = useQuery({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'verifyWallet', params],
    queryFn: () => {
      return AuctionQueryClient.verifyWallet({
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
      return awaitingZkPassportCredential && shouldPollForZkPassportCredential(query.state.data?.validations)
        ? PollingInterval.Fast
        : false
    },
  })

  const presaleValidation = verifyWalletQuery.data?.validations.find(isAllowlistedValidation)
  const expirationBlock = presaleValidation?.data.value?.expirationBlock
  const presaleGateExpired =
    expirationBlock !== undefined && currentBlockNumber !== undefined && currentBlockNumber > Number(expirationBlock)

  const { refetch } = verifyWalletQuery
  useEffect(() => {
    if (enabled && presaleGateExpired) {
      void refetch()
    }
  }, [enabled, presaleGateExpired, refetch])

  return verifyWalletQuery
}

export function isKycValidation(v: AuctionValidation): v is AuctionValidation & {
  data: { value: PredicateKycVerificationData | undefined }
} {
  return v.validationType === ValidationType.KYC_VERIFICATION
}

/** Matched on the oneof case too, so a malformed entry can't pass for one carrying a policy id. */
export function isZkPassportValidation(v: AuctionValidation): v is AuctionValidation & {
  data: { case: 'zkPassportVerificationData'; value: ZkPassportVerificationData }
} {
  return v.validationType === ValidationType.ZKPASSPORT_VERIFICATION && v.data.case === 'zkPassportVerificationData'
}

/**
 * The wallet must mint a ZKPassport credential before it can bid. An entry without a policy id is an auction
 * never registered with the hook: no credential helps, every bid reverts.
 */
export function needsZkPassportCredential(
  v: AuctionValidation & { data: { value: ZkPassportVerificationData } },
): boolean {
  return !v.validationPassed && v.data.value.policyId !== ''
}

/** A ZKPassport credential is minted client-side, so a wallet minting one keeps checking until it shows up. */
export function shouldPollForZkPassportCredential(validations: AuctionValidation[] | undefined): boolean {
  const zkPassportValidation = validations?.find(isZkPassportValidation)
  return zkPassportValidation !== undefined && needsZkPassportCredential(zkPassportValidation)
}

export function isAllowlistedValidation(v: AuctionValidation): v is AuctionValidation & {
  data: { value: Erc1155GateData | undefined }
} {
  return v.validationType === ValidationType.ERC_1155_GATEWAY
}

/** A validation that gates the WALLET, as opposed to the bid amount. */
function isDeclaredWalletGatingType(v: AuctionValidation): boolean {
  return (
    v.validationType === ValidationType.KYC_VERIFICATION ||
    v.validationType === ValidationType.ERC_1155_GATEWAY ||
    v.validationType === ValidationType.ZKPASSPORT_VERIFICATION
  )
}

/**
 * Whether a validation carries the auction's bid price ceiling.
 *
 * The invariant: the oneof case alone decides, and a declared wallet-gating type is never
 * the ceiling whatever payload it carries. Never match on the enum ordinal — that would let
 * a malformed response reclassify a wallet gate as the ceiling and drop it from the set
 * that gates bidding.
 */
export function isMaxBidPriceValidation(
  v: AuctionValidation,
): v is AuctionValidation & { data: { case: 'maxBidPriceData'; value: MaxBidPriceData } } {
  return !isDeclaredWalletGatingType(v) && v.data.case === 'maxBidPriceData'
}

/**
 * The auction-wide bid price ceiling, as a Q96 decimal string, or undefined when the
 * auction's validation hook imposes none.
 *
 * Independent of KYC and of the allowlist: a hook can impose a ceiling on its own or
 * alongside either of them, and the ceiling applies to every wallet regardless of its
 * own verification status, so this never consults `validationPassed`.
 *
 * Matched by {@link isMaxBidPriceValidation} on the oneof case name alone — see the
 * reasoning there for why no enum-ordinal fallback is involved.
 *
 * Returns a bigint rather than the wire string so the parse cannot be deferred to callers:
 * the whole point is that an unparseable value never reaches a `BigInt()` at render time.
 * Anything that is not a positive integer string within uint256's width yields undefined.
 */
export function getMaxBidPriceQ96(validations: AuctionValidation[] | undefined): bigint | undefined {
  const validation = validations?.find(isMaxBidPriceValidation)
  const raw: unknown = validation?.data.value.maxBidPriceQ96
  // 78 digits is uint256's decimal width, so this bounds MAGNITUDE as well as character
  // set: the ceiling is a uint256 on chain, and anything wider cannot be one. Without the
  // cap an arbitrarily long digit string still reaches BigInt, the tick math, and the
  // banner copy — a main-thread stall from the same contract break the warn below reports.
  if (typeof raw !== 'string' || !/^\d{1,78}$/.test(raw)) {
    // `''` is excluded deliberately: proto3 gives a string field an empty-string default,
    // so an unset max_bid_price_q96 decodes to '' and is indistinguishable from absent.
    // Warning on it would report a contract break for a message that simply omitted the
    // field, which is the noisiest possible false positive — it fires per response.
    if (typeof raw === 'string' && raw !== '') {
      // A value that is present but unparseable IS a backend contract break, and it
      // silently disables every ceiling behavior at once — bidders would start hitting
      // on-chain MaxBidPriceExceeded reverts with nothing pointing at the cause.
      logger.warn('useVerifyWallet', 'getMaxBidPriceQ96', 'Unparseable maxBidPriceQ96; ignoring ceiling', {
        rawLength: raw.length,
      })
    }
    return undefined
  }
  const parsed = BigInt(raw)
  // A zero ceiling is no ceiling: no price can be both strictly above the clearing price
  // and at or below zero, so honoring it would render a live auction as closed.
  return parsed === 0n ? undefined : parsed
}

/** Who verifies a bidder's identity for an auction that requires it */
export enum KycProvider {
  /** Predicate: the bidder verifies on Predicate's site, which reports back through the backend */
  Predicate = 'Predicate',
  /** ZKPassport: the bidder mints a credential to their wallet from the ZKPassport app */
  ZkPassport = 'ZkPassport',
}

/**
 * Legacy response shape for backwards compatibility with useAuctionKycStatus
 */
export interface LegacyVerifyWalletResponse {
  status: KycVerificationStatus
  /** Set whenever the auction requires identity verification */
  kycProvider?: KycProvider
  redirectUrl?: string
  /** The 32-byte hex ZKPassport policy a bidder mints a credential for; unset when the auction can't be verified */
  zkPassportPolicyId?: string
  isAllowlisted: boolean
  hasPresale: boolean
  hasKycVerification: boolean
  canBid: boolean
  allowlistEndBlock?: number
}

/**
 * Transforms the new AuctionValidation[] response to the legacy flat structure
 * used by useAuctionKycStatus for backwards compatibility.
 */
export function toLegacyVerifyWalletResponse(validations: AuctionValidation[]): LegacyVerifyWalletResponse {
  const kycValidation = validations.find(isKycValidation)
  const zkPassportValidation = validations.find(isZkPassportValidation)
  const presaleValidation = validations.find(isAllowlistedValidation)

  const kycData = kycValidation?.data.value ?? zkPassportValidation?.data.value
  const kycProvider = kycValidation ? KycProvider.Predicate : zkPassportValidation ? KycProvider.ZkPassport : undefined
  const hasKycVerification = kycProvider !== undefined
  const hasPresale = !!presaleValidation

  const expirationBlock = presaleValidation?.data.value?.expirationBlock
  const allowlistEndBlock = expirationBlock !== undefined ? Number(expirationBlock) : undefined

  // All WALLET-GATING validations must pass to bid. The ceiling is excluded because it
  // gates the bid amount, not the wallet: folding it in would let a `validationPassed:
  // false` on that entry block wallets that are entitled to bid, and on an auction with no
  // KYC validation would be silently ignored instead. Its consumer is getMaxBidPriceQ96.
  const walletGatingValidations = validations.filter((v) => !isMaxBidPriceValidation(v))
  const canBid = walletGatingValidations.length > 0 && walletGatingValidations.every((v) => v.validationPassed)

  let status = kycData?.status
  // A held ZKPassport credential is the whole verification, so it reads as completed whatever status rides along.
  if (!kycValidation && zkPassportValidation?.validationPassed) {
    status = KycVerificationStatus.VERIFICATION_STATUS_COMPLETED
  }
  if (status === KycVerificationStatus.VERIFICATION_STATUS_UNSPECIFIED) {
    status = KycVerificationStatus.VERIFICATION_STATUS_NOT_STARTED
  }

  return {
    status: status ?? KycVerificationStatus.VERIFICATION_STATUS_UNSPECIFIED,
    kycProvider,
    redirectUrl: kycValidation?.data.value?.redirectUrl,
    zkPassportPolicyId:
      zkPassportValidation && needsZkPassportCredential(zkPassportValidation)
        ? zkPassportValidation.data.value.policyId
        : undefined,
    isAllowlisted: presaleValidation?.validationPassed ?? false,
    hasPresale,
    hasKycVerification,
    canBid,
    allowlistEndBlock,
  }
}
