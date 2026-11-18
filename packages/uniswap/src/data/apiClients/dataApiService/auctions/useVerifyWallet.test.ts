import {
  AuctionValidation,
  Erc1155GateData,
  MaxBidPriceData,
  KycVerificationStatus,
  PredicateKycVerificationData,
  ValidationType,
  ZkPassportVerificationData,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import {
  getMaxBidPriceQ96,
  isZkPassportValidation,
  KycProvider,
  needsZkPassportCredential,
  shouldPollForZkPassportCredential,
  toLegacyVerifyWalletResponse,
} from 'uniswap/src/data/apiClients/dataApiService/auctions/useVerifyWallet'
import { logger } from 'utilities/src/logger/logger'
import { describe, expect, it, vi } from 'vitest'

const MAX_BID_PRICE = ValidationType.MAX_BID_PRICE
const CEILING_Q96 = '79228162514264337593543950336'
const CEILING_BIG = 79228162514264337593543950336n

function maxBidPriceValidation(maxBidPriceQ96: string): AuctionValidation {
  return new AuctionValidation({
    validationType: MAX_BID_PRICE,
    validationPassed: true,
    data: { case: 'maxBidPriceData', value: new MaxBidPriceData({ maxBidPriceQ96 }) },
  })
}

function kycValidation(validationPassed: boolean): AuctionValidation {
  return new AuctionValidation({
    validationType: ValidationType.KYC_VERIFICATION,
    validationPassed,
    data: {
      case: 'kycVerificationData',
      value: new PredicateKycVerificationData({
        status: validationPassed
          ? KycVerificationStatus.VERIFICATION_STATUS_COMPLETED
          : KycVerificationStatus.VERIFICATION_STATUS_REJECTED,
      }),
    },
  })
}

describe('getMaxBidPriceQ96', () => {
  it('returns undefined when there are no validations at all', () => {
    expect(getMaxBidPriceQ96(undefined)).toBeUndefined()
    expect(getMaxBidPriceQ96([])).toBeUndefined()
  })

  it('returns undefined when no validation carries a ceiling', () => {
    expect(
      getMaxBidPriceQ96([
        kycValidation(true),
        new AuctionValidation({
          validationType: ValidationType.ERC_1155_GATEWAY,
          validationPassed: true,
          data: { case: 'erc1155GateData', value: new Erc1155GateData({ expirationBlock: '100' }) },
        }),
      ]),
    ).toBeUndefined()
  })

  it('reads the ceiling when it is the only validation, already parsed to bigint', () => {
    // Returns bigint, not the wire string: the guarantee that it is BigInt-safe belongs
    // in the signature, not in each caller.
    expect(getMaxBidPriceQ96([maxBidPriceValidation(CEILING_Q96)])).toBe(CEILING_BIG)
  })

  it('reads the ceiling alongside KYC, in either order', () => {
    expect(getMaxBidPriceQ96([maxBidPriceValidation(CEILING_Q96), kycValidation(true)])).toBe(CEILING_BIG)
    expect(getMaxBidPriceQ96([kycValidation(true), maxBidPriceValidation(CEILING_Q96)])).toBe(CEILING_BIG)
  })

  it('reads the ceiling even when the wallet fails KYC', () => {
    // The ceiling binds the auction, not the wallet: a wallet that cannot bid still
    // needs the ceiling rendered.
    expect(getMaxBidPriceQ96([maxBidPriceValidation(CEILING_Q96), kycValidation(false)])).toBe(CEILING_BIG)
  })

  it('treats an empty ceiling string as absent rather than as zero', () => {
    // A '' would otherwise become BigInt('') === 0n downstream and read as a ceiling
    // of zero, which would close every auction.
    expect(getMaxBidPriceQ96([maxBidPriceValidation('')])).toBeUndefined()
  })

  it('rejects a non-numeric ceiling rather than letting BigInt() throw downstream', () => {
    // The consumer BigInt-parses this. A crash there takes out the whole bid form, so
    // anything that is not a digit string is treated as absent at the boundary.
    for (const bad of ['abc', '1.5', '-1', '1e18', ' 12', '12 ', '0x10']) {
      expect(getMaxBidPriceQ96([maxBidPriceValidation(bad)])).toBeUndefined()
    }
  })

  it('warns when the ceiling is present but unparseable, and stays silent when absent', () => {
    // Present-but-broken must be distinguishable from the deliberate pre-bump inertness:
    // both disable every ceiling behavior, but only one is a backend contract break.
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    try {
      expect(getMaxBidPriceQ96([maxBidPriceValidation('0x10')])).toBeUndefined()
      expect(warn).toHaveBeenCalledTimes(1)

      warn.mockClear()
      expect(getMaxBidPriceQ96([kycValidation(true)])).toBeUndefined()
      expect(getMaxBidPriceQ96(undefined)).toBeUndefined()
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('rejects a ceiling wider than uint256, not just one with bad characters', () => {
    // All digits, so a charset-only check would pass it straight into BigInt and the tick
    // math. 79 digits cannot be a uint256, so it cannot be a real ceiling.
    const tooWide = '9'.repeat(79)
    expect(getMaxBidPriceQ96([maxBidPriceValidation(tooWide)])).toBeUndefined()
    // The widest legitimate value still resolves.
    const uint256Max = (2n ** 256n - 1n).toString()
    expect(uint256Max).toHaveLength(78)
    expect(getMaxBidPriceQ96([maxBidPriceValidation(uint256Max)])).toBe(2n ** 256n - 1n)
  })

  it('treats an unset field as absent, without logging a contract break', () => {
    // proto3 defaults a string field to '', so an unset max_bid_price_q96 is
    // indistinguishable from absent. Warning on it would fire per response.
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    try {
      expect(getMaxBidPriceQ96([maxBidPriceValidation('')])).toBeUndefined()
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('treats a zero ceiling as absent', () => {
    // No price can be both strictly above the clearing price and at or below zero, so
    // honoring a zero would render a live auction as closed to new bids.
    expect(getMaxBidPriceQ96([maxBidPriceValidation('0')])).toBeUndefined()
    expect(getMaxBidPriceQ96([maxBidPriceValidation('000')])).toBeUndefined()
  })

  it('resolves the ceiling by oneof case whatever the enum ordinal says', () => {
    // Guards the client-liquidity bump: matching is on the case name only, so an ordinal
    // landing elsewhere cannot make the ceiling vanish from the UI.
    const wrongOrdinal = new AuctionValidation({
      validationType: 99 as ValidationType,
      validationPassed: true,
      data: { case: 'maxBidPriceData', value: new MaxBidPriceData({ maxBidPriceQ96: CEILING_Q96 }) },
    })
    expect(getMaxBidPriceQ96([wrongOrdinal])).toBe(CEILING_BIG)
  })

  it('reads no ceiling pre-bump, when the client cannot decode the oneof', () => {
    // A client generated without field 5 leaves BOTH data.case and data.value undefined,
    // so there is nothing to read and the feature is inert rather than broken. This is the
    // real pre-bump contract — and the reason an ordinal fallback bought nothing.
    const undecodable = new AuctionValidation({ validationType: MAX_BID_PRICE, validationPassed: true })
    expect(getMaxBidPriceQ96([undecodable])).toBeUndefined()
  })
})

describe('toLegacyVerifyWalletResponse canBid', () => {
  it('ignores the ceiling entry when deciding whether the wallet may bid', () => {
    // The ceiling gates the bid amount, not the wallet. Folding it in would let a
    // validationPassed:false on that entry block wallets entitled to bid.
    const legacy = toLegacyVerifyWalletResponse([
      new AuctionValidation({
        validationType: MAX_BID_PRICE,
        validationPassed: false,
        data: { case: 'maxBidPriceData', value: new MaxBidPriceData({ maxBidPriceQ96: CEILING_Q96 }) },
      }),
      kycValidation(true),
    ])
    expect(legacy.canBid).toBe(true)
    expect(legacy.hasKycVerification).toBe(true)
  })

  it('does not turn a ceiling-only auction into a passing wallet gate', () => {
    // With no wallet-gating validation at all, canBid must stay false — the ceiling
    // must not be mistaken for a satisfied gate.
    const legacy = toLegacyVerifyWalletResponse([maxBidPriceValidation(CEILING_Q96)])
    expect(legacy.canBid).toBe(false)
    expect(legacy.hasKycVerification).toBe(false)
  })

  it('does not drop a failing wallet gate that merely shares the ceiling ordinal', () => {
    // A decodable wallet-gating payload must never be reclassified as the ceiling: it
    // would be filtered out of the set that gates bidding and canBid would fail open.
    //
    // The PASSING entry is load-bearing. Without it the filtered set is empty, `length > 0`
    // yields false, and the assertion holds even when the failing gate IS wrongly dropped —
    // the test would pass against the very bug it exists to catch.
    const failingGateOnCeilingOrdinal = new AuctionValidation({
      validationType: MAX_BID_PRICE,
      validationPassed: false,
      data: {
        case: 'kycVerificationData',
        value: new PredicateKycVerificationData({
          status: KycVerificationStatus.VERIFICATION_STATUS_REJECTED,
        }),
      },
    })
    const passingGate = new AuctionValidation({
      validationType: ValidationType.ERC_1155_GATEWAY,
      validationPassed: true,
      data: { case: 'erc1155GateData', value: new Erc1155GateData({ expirationBlock: '100' }) },
    })
    expect(toLegacyVerifyWalletResponse([failingGateOnCeilingOrdinal, passingGate]).canBid).toBe(false)
  })

  it('never reclassifies a declared wallet gate as the ceiling, whatever payload it carries', () => {
    // A malformed or tampered response pairing a wallet-gating validationType with a
    // maxBidPriceData payload must not be dropped from the gating set. The passing entry
    // is again load-bearing: without it the empty-set short-circuit hides the bug.
    const tamperedGate = new AuctionValidation({
      validationType: ValidationType.KYC_VERIFICATION,
      validationPassed: false,
      data: { case: 'maxBidPriceData', value: new MaxBidPriceData({ maxBidPriceQ96: CEILING_Q96 }) },
    })
    const passingGate = new AuctionValidation({
      validationType: ValidationType.ERC_1155_GATEWAY,
      validationPassed: true,
      data: { case: 'erc1155GateData', value: new Erc1155GateData({ expirationBlock: '100' }) },
    })
    expect(toLegacyVerifyWalletResponse([tamperedGate, passingGate]).canBid).toBe(false)
  })

  it('leaves an undecodable ceiling in the gating set, where it is inert', () => {
    // Pre-bump the entry is not recognized as the ceiling, so it stays in the wallet-gating
    // set. That is harmless BECAUSE the backend always marks the ceiling passed — asserted
    // explicitly, together with the failing case below, so this cannot pass with the
    // exclusion disabled entirely.
    const undecodablePassing = new AuctionValidation({ validationType: MAX_BID_PRICE, validationPassed: true })
    expect(toLegacyVerifyWalletResponse([undecodablePassing, kycValidation(true)]).canBid).toBe(true)

    // And if such an entry ever arrived NOT passed, it blocks rather than being ignored —
    // the fail-closed direction, which is the point of not matching on the ordinal.
    const undecodableFailing = new AuctionValidation({ validationType: MAX_BID_PRICE, validationPassed: false })
    expect(toLegacyVerifyWalletResponse([undecodableFailing, kycValidation(true)]).canBid).toBe(false)
  })

  it('still blocks a wallet that fails KYC alongside a ceiling', () => {
    const legacy = toLegacyVerifyWalletResponse([maxBidPriceValidation(CEILING_Q96), kycValidation(false)])
    expect(legacy.canBid).toBe(false)
  })
})

describe('ZKPassport validations', () => {
  const POLICY_ID = `0x${'1'.padStart(64, '0')}`

  function zkPassportValidation({ passed, policyId = POLICY_ID }: { passed: boolean; policyId?: string }) {
    return new AuctionValidation({
      validationType: ValidationType.ZKPASSPORT_VERIFICATION,
      validationPassed: passed,
      data: { case: 'zkPassportVerificationData', value: new ZkPassportVerificationData({ policyId }) },
    })
  }

  it('recognises a ZKPassport entry only with its own payload', () => {
    expect(isZkPassportValidation(zkPassportValidation({ passed: false }))).toBe(true)
    expect(isZkPassportValidation(kycValidation(false))).toBe(false)
    expect(
      isZkPassportValidation(
        new AuctionValidation({
          validationType: ValidationType.ZKPASSPORT_VERIFICATION,
          data: { case: 'kycVerificationData', value: new PredicateKycVerificationData({}) },
        }),
      ),
    ).toBe(false)
  })

  it('needs a credential only when the wallet fails a registered gate', () => {
    const failing = zkPassportValidation({ passed: false })
    const passing = zkPassportValidation({ passed: true })
    const unregistered = zkPassportValidation({ passed: false, policyId: '' })
    expect(isZkPassportValidation(failing) && needsZkPassportCredential(failing)).toBe(true)
    expect(isZkPassportValidation(passing) && needsZkPassportCredential(passing)).toBe(false)
    expect(isZkPassportValidation(unregistered) && needsZkPassportCredential(unregistered)).toBe(false)
  })

  it('blocks bidding until the wallet passes the gate', () => {
    expect(toLegacyVerifyWalletResponse([zkPassportValidation({ passed: false })]).canBid).toBe(false)
    expect(toLegacyVerifyWalletResponse([zkPassportValidation({ passed: true })]).canBid).toBe(true)
  })

  it('polls for a credential only while a registered gate still fails', () => {
    expect(shouldPollForZkPassportCredential([zkPassportValidation({ passed: false })])).toBe(true)
    expect(shouldPollForZkPassportCredential([zkPassportValidation({ passed: true })])).toBe(false)
    expect(shouldPollForZkPassportCredential([zkPassportValidation({ passed: false, policyId: '' })])).toBe(false)
    expect(shouldPollForZkPassportCredential([kycValidation(false)])).toBe(false)
    expect(shouldPollForZkPassportCredential(undefined)).toBe(false)
  })

  it('reports the gate as identity verification by ZKPassport', () => {
    const legacy = toLegacyVerifyWalletResponse([zkPassportValidation({ passed: false })])
    expect(legacy.hasKycVerification).toBe(true)
    expect(legacy.kycProvider).toBe(KycProvider.ZkPassport)
    expect(legacy.status).toBe(KycVerificationStatus.VERIFICATION_STATUS_NOT_STARTED)
    expect(legacy.zkPassportPolicyId).toBe(POLICY_ID)
  })

  it('reads a held credential as completed verification', () => {
    const legacy = toLegacyVerifyWalletResponse([zkPassportValidation({ passed: true })])
    expect(legacy.status).toBe(KycVerificationStatus.VERIFICATION_STATUS_COMPLETED)
    expect(legacy.zkPassportPolicyId).toBeUndefined()
  })

  it('leaves a Predicate status alone, even alongside a passing ZKPassport entry', () => {
    const legacy = toLegacyVerifyWalletResponse([kycValidation(false), zkPassportValidation({ passed: true })])
    expect(legacy.kycProvider).toBe(KycProvider.Predicate)
    expect(legacy.status).not.toBe(KycVerificationStatus.VERIFICATION_STATUS_COMPLETED)
    expect(legacy.canBid).toBe(false)
  })

  it('offers no policy to mint for an auction never registered with the hook', () => {
    expect(
      toLegacyVerifyWalletResponse([zkPassportValidation({ passed: false, policyId: '' })]).zkPassportPolicyId,
    ).toBe(undefined)
  })

  it('never reads a ZKPassport gate as the bid price ceiling', () => {
    expect(getMaxBidPriceQ96([zkPassportValidation({ passed: true }), maxBidPriceValidation(CEILING_Q96)])).toBe(
      CEILING_BIG,
    )
  })
})
