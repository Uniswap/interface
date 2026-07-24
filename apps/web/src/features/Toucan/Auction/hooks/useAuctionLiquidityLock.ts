import { useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { useStatsBannerData } from '~/features/Toucan/Auction/hooks/useStatsBannerData'
import { AuctionLiquidityLockInfo, AuctionLockMode } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { approximateNumberFromRaw, formatCompactFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { formatTimestampToDate } from '~/features/Toucan/Auction/utils/formatting'
import { getAuctionTokenDecimals } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { useBlockTimestamp } from '~/hooks/useBlockTimestamp'

export interface AuctionLiquidityLockData {
  /** True when the graduated LP position is held by a lock recipient contract (or burned) */
  isLocked: boolean
  /**
   * True when the lock can never unlock — burn-mode locks and legacy max-int "Permanent"
   * timelocks (`locked_forever` on the wire). Render "Forever" instead of an unlock date.
   */
  isPermanentlyLocked: boolean
  /**
   * Lock mode from the raw lock data — undefined only when there is no lock or the mode is
   * unrecognized. Independent of expiry (buyback-burn characteristics persist after a lock expires).
   */
  lockMode: AuctionLockMode | undefined
  /**
   * True when the lock is a buyback & burn recipient. Independent of expiry — the burn is
   * permanent, so this stays true after a lock unlocks. All buyback UI must be hidden when false.
   */
  isBuybackEnabled: boolean
  /** True when the lock is a fees-forwarder recipient */
  isFeesForwarder: boolean
  /** Estimated unlock timestamp derived from `unlockBlock` (future-block estimation) */
  unlockTimestamp: bigint | undefined
  /** Estimated unlock date for display, e.g. "12/31/2026" */
  unlockDateFormatted: string | undefined
  /** Timelock operator when locked; pool owner otherwise */
  lpOwner: string | undefined
  /** Fee recipient address — fees-forwarder mode only */
  feeRecipient: string | undefined
  /** True when at least one buyback burn has happened (distinguishes the zero state) */
  hasBurnedTokens: boolean
  /** Cumulative burned amount in token terms, e.g. "1.2K TCAN". Zero state renders "0 TCAN". */
  burnedAmountFormatted: string | undefined
  /**
   * USD value of the cumulative burned amount, valued at the CURRENT token price (the backend
   * serves only raw token units). Undefined when no fiat price is available. Consumers must
   * surface the "valued at current price" disclosure alongside this figure.
   */
  burnedUsdFormatted: string | undefined
}

const LOCK_MODE_BY_WIRE_VALUE: Record<string, AuctionLockMode> = {
  '1': AuctionLockMode.Timelock,
  '2': AuctionLockMode.FeesForwarder,
  '3': AuctionLockMode.BuybackBurn,
  '4': AuctionLockMode.Burn,
  TIMELOCK: AuctionLockMode.Timelock,
  FEES_FORWARDER: AuctionLockMode.FeesForwarder,
  BUYBACK_BURN: AuctionLockMode.BuybackBurn,
  BURN: AuctionLockMode.Burn,
  LOCK_MODE_TIMELOCK: AuctionLockMode.Timelock,
  LOCK_MODE_FEES_FORWARDER: AuctionLockMode.FeesForwarder,
  LOCK_MODE_BUYBACK_BURN: AuctionLockMode.BuybackBurn,
  LOCK_MODE_BURN: AuctionLockMode.Burn,
}

function parseLockMode(lockMode: AuctionLiquidityLockInfo['lockMode']): AuctionLockMode | undefined {
  if (lockMode === undefined) {
    return undefined
  }
  return LOCK_MODE_BY_WIRE_VALUE[String(lockMode)]
}

function parseBigIntOrUndefined(value: string | number | bigint | undefined): bigint | undefined {
  if (value === undefined || value === '') {
    return undefined
  }
  try {
    return BigInt(value)
  } catch {
    return undefined
  }
}

/**
 * A lock reads as active only while its unlock block is still in the future. Compare block
 * numbers against `currentBlockNumber` — never the estimated unlock date, which drifts.
 * `lockedForever` locks (burn / legacy max-int sentinel) never expire; any finite-unlockBlock
 * lock — including buyback-burn — expires once the block is reached. While `currentBlockNumber`
 * is undefined (still loading) the lock stays active to avoid a flash-off of the indicators.
 */
function resolveIsLocked({
  hasLockRecipient,
  isPermanentlyLocked,
  unlockBlock,
  currentBlockNumber,
}: {
  hasLockRecipient: boolean
  isPermanentlyLocked: boolean
  unlockBlock: bigint | undefined
  currentBlockNumber: number | undefined
}): boolean {
  if (isPermanentlyLocked) {
    return true
  }
  if (!hasLockRecipient) {
    return false
  }
  if (unlockBlock === undefined || currentBlockNumber === undefined) {
    return true
  }
  return BigInt(currentBlockNumber) < unlockBlock
}

/**
 * Derives display state for an auction's liquidity lock (timelock / fees-forwarder /
 * buyback & burn) from `GetAuction` data.
 *
 * The lock fields ride the polled auction read (see useLoadAuctionDetails), so burn totals
 * stay live. Until the backend serves `liquidity_lock`, this returns `isLocked: false` and
 * all lock/buyback UI stays hidden — every element consuming this hook must be conditional
 * on the data existing.
 */
export function useAuctionLiquidityLock(): AuctionLiquidityLockData {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // Current token price source shared with the rest of the auction page:
  // clearing price (bid token per auction token) x bid token fiat price
  const { clearingPriceDecimal, bidTokenInfo } = useStatsBannerData()

  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const currentBlockNumber = useAuctionStore((state) => state.currentBlockNumber)

  const lock = auctionDetails?.liquidityLock
  // Burn-mode locks and legacy max-int "Permanent" timelocks are served with `lockedForever`
  const isPermanentlyLocked = Boolean(lock?.lockedForever)

  // An expired lock reads as never-locked (see resolveIsLocked), so the lock-status indicators —
  // chip, lock icon, "LP locked until", lpOwner — clear on expiry. Buyback-burn UI is derived
  // separately below and intentionally survives expiry.
  const unlockBlockBigInt = parseBigIntOrUndefined(lock?.unlockBlock)
  const isLocked = resolveIsLocked({
    hasLockRecipient: Boolean(lock?.lockRecipient),
    isPermanentlyLocked,
    unlockBlock: unlockBlockBigInt,
    currentBlockNumber,
  })

  // Buyback & burn is a permanent token characteristic, not a lock-active state, so its mode and
  // burned totals must survive lock expiry — derive them from the raw lock mode, never from the
  // expiry-aware isLocked. Fees-forwarding, by contrast, stops once the LP unlocks (see feeRecipient).
  const lockMode = parseLockMode(lock?.lockMode)
  const isBuybackEnabled = lockMode === AuctionLockMode.BuybackBurn
  const isFeesForwarder = lockMode === AuctionLockMode.FeesForwarder

  // Backend serves the unlock block only — estimate the calendar date the same way the
  // auction countdown estimates future blocks. A permanent lock has no meaningful unlock
  // block (0 for burn), so it must never feed the estimator.
  const unlockBlock = isLocked && !isPermanentlyLocked ? unlockBlockBigInt : undefined
  const unlockTimestamp = useBlockTimestamp({
    chainId: auctionDetails?.chainId,
    blockNumber: unlockBlock === undefined ? undefined : Number(unlockBlock),
  })
  const unlockDateFormatted = unlockTimestamp === undefined ? undefined : formatTimestampToDate(unlockTimestamp)

  const lpOwner = (isLocked ? lock?.lpOperator : auctionDetails?.poolOwner) || undefined
  // Fee forwarding is only meaningful while the LP is actually locked — hide it once expired
  const feeRecipient = (isLocked && isFeesForwarder ? lock?.feeRecipient : undefined) || undefined

  const auctionTokenDecimals = getAuctionTokenDecimals(auctionDetails?.token)
  const auctionTokenSymbol = auctionDetails?.token?.currency.symbol ?? auctionDetails?.tokenSymbol

  // Zero state: buyback enabled but nothing burned yet still renders a "0 <symbol>" amount
  const burnedAmountRaw = isBuybackEnabled ? (parseBigIntOrUndefined(lock?.totalTokensBurned) ?? 0n) : undefined
  const hasBurnedTokens = burnedAmountRaw !== undefined && burnedAmountRaw > 0n

  const burnedAmountFormatted = useMemo(() => {
    if (burnedAmountRaw === undefined || auctionTokenDecimals === undefined) {
      return undefined
    }
    const amount = formatCompactFromRaw({
      raw: burnedAmountRaw,
      decimals: auctionTokenDecimals,
      maxFractionDigits: 2,
    })
    return `${amount} ${auctionTokenSymbol ?? ''}`.trim()
  }, [burnedAmountRaw, auctionTokenDecimals, auctionTokenSymbol])

  const burnedUsdFormatted = useMemo(() => {
    if (burnedAmountRaw === undefined || auctionTokenDecimals === undefined) {
      return undefined
    }
    // No fiat price available (e.g. testnets) — omit the USD figure rather than showing $0
    if (!bidTokenInfo || bidTokenInfo.priceFiat === 0) {
      return undefined
    }
    const burnedTokens = approximateNumberFromRaw({
      raw: burnedAmountRaw,
      decimals: auctionTokenDecimals,
    })
    const burnedUsd = burnedTokens * clearingPriceDecimal * bidTokenInfo.priceFiat
    return convertFiatAmountFormatted(burnedUsd, NumberType.FiatTokenStats)
  }, [burnedAmountRaw, auctionTokenDecimals, bidTokenInfo, clearingPriceDecimal, convertFiatAmountFormatted])

  return {
    isLocked,
    isPermanentlyLocked,
    lockMode,
    isBuybackEnabled,
    isFeesForwarder,
    unlockTimestamp,
    unlockDateFormatted,
    lpOwner,
    feeRecipient,
    hasBurnedTokens,
    burnedAmountFormatted,
    burnedUsdFormatted,
  }
}
