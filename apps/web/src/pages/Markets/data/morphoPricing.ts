import { UniverseChainId } from 'uniswap/src/features/chains/types'

const ORACLE_PRICE_SCALE = 1e36

const USD_STABLE_TOKENS: Readonly<Record<number, readonly `0x${string}`[]>> = Object.freeze({
  [UniverseChainId.Mainnet]: [
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    '0xdac17f958d2ee523a2206206994597c13d831ec7',
    '0x6b175474e89094c44da98b954eedeac495271d0f',
  ],
  [UniverseChainId.Sepolia]: [
    '0xa7a151d60bbd522d3611c2db3f1f972ee9904b3e',
    '0x5fbad067f69ebbc276410d78ff52823be133ed48',
  ],
})

function normalizeAddress(address: string): `0x${string}` {
  return address.toLowerCase() as `0x${string}`
}

function isUsdStableToken(chainId: number, tokenAddress: string): boolean {
  const stableTokens = USD_STABLE_TOKENS[chainId]
  if (!stableTokens) {
    return false
  }

  const normalizedAddress = normalizeAddress(tokenAddress)
  return stableTokens.includes(normalizedAddress)
}

export function maybeToUsdValue(amount: number, chainId: number, tokenAddress: string): number | undefined {
  return isUsdStableToken(chainId, tokenAddress) ? amount : undefined
}

export function oraclePriceToQuoteTokenAmount(
  oraclePrice: bigint | undefined,
  collateralDecimals: number,
  loanDecimals: number,
): number | undefined {
  if (typeof oraclePrice !== 'bigint') {
    return undefined
  }

  const scale = ORACLE_PRICE_SCALE * 10 ** (loanDecimals - collateralDecimals)
  return Number(oraclePrice) / scale
}

const VIRTUAL_ASSETS = 1n
const VIRTUAL_SHARES = 1_000_000n

function sharesToAssetsDown(shares: bigint, totalAssets: bigint, totalShares: bigint): bigint {
  return (shares * (totalAssets + VIRTUAL_ASSETS)) / (totalShares + VIRTUAL_SHARES)
}

function sharesToAssetsUp(shares: bigint, totalAssets: bigint, totalShares: bigint): bigint {
  const denominator = totalShares + VIRTUAL_SHARES
  const numerator = shares * (totalAssets + VIRTUAL_ASSETS)
  return (numerator + denominator - 1n) / denominator
}

export function computeSupplyAssets(position: {
  supplyShares: bigint
  totalSupplyAssets: bigint
  totalSupplyShares: bigint
}): bigint {
  return sharesToAssetsDown(position.supplyShares, position.totalSupplyAssets, position.totalSupplyShares)
}

export function computeBorrowAssets(position: {
  borrowShares: bigint
  totalBorrowAssets: bigint
  totalBorrowShares: bigint
}): bigint {
  return sharesToAssetsUp(position.borrowShares, position.totalBorrowAssets, position.totalBorrowShares)
}

const WAD = 10n ** 18n
const ORACLE_PRICE_SCALE_BI = 10n ** 36n

function mulDivDown(x: bigint, y: bigint, d: bigint): bigint {
  return (x * y) / d
}

function mulDivUp(x: bigint, y: bigint, d: bigint): bigint {
  return (x * y + d - 1n) / d
}

/**
 * Apply a 0.5% safety margin to account for interest accrual between
 * the on-chain read and actual transaction execution.
 */
function applySafetyMargin(value: bigint): bigint {
  return (value * 995n) / 1000n
}

export function computeMaxBorrowable(params: {
  collateral: bigint
  borrowShares: bigint
  totalBorrowAssets: bigint
  totalBorrowShares: bigint
  totalSupplyAssets: bigint
  oraclePrice: bigint
  lltv: bigint
}): bigint {
  const { collateral, borrowShares, totalBorrowAssets, totalBorrowShares, totalSupplyAssets, oraclePrice, lltv } =
    params
  if (collateral === 0n || oraclePrice === 0n) {
    return 0n
  }

  const borrowCapacity = mulDivDown(mulDivDown(collateral, oraclePrice, ORACLE_PRICE_SCALE_BI), lltv, WAD)
  const borrowed = sharesToAssetsUp(borrowShares, totalBorrowAssets, totalBorrowShares)

  let maxFromHealth = borrowCapacity > borrowed ? borrowCapacity - borrowed : 0n

  const poolLiquidity = totalSupplyAssets > totalBorrowAssets ? totalSupplyAssets - totalBorrowAssets : 0n
  if (maxFromHealth > poolLiquidity) {
    maxFromHealth = poolLiquidity
  }

  return applySafetyMargin(maxFromHealth)
}

export function computeMaxWithdrawableCollateral(params: {
  collateral: bigint
  borrowShares: bigint
  totalBorrowAssets: bigint
  totalBorrowShares: bigint
  oraclePrice: bigint
  lltv: bigint
}): bigint {
  const { collateral, borrowShares, totalBorrowAssets, totalBorrowShares, oraclePrice, lltv } = params
  if (borrowShares === 0n || totalBorrowShares === 0n) {
    return collateral
  }

  const borrowed = sharesToAssetsUp(borrowShares, totalBorrowAssets, totalBorrowShares)
  if (borrowed === 0n) {
    return collateral
  }

  if (oraclePrice === 0n || lltv === 0n) {
    return 0n
  }

  const minCollateral = mulDivUp(mulDivUp(borrowed, WAD, lltv), ORACLE_PRICE_SCALE_BI, oraclePrice)
  const maxRaw = collateral > minCollateral ? collateral - minCollateral : 0n
  return applySafetyMargin(maxRaw)
}

/**
 * Liquidation boundary in human-readable loan-per-collateral units.
 *
 * Health check: collateral_human * oraclePrice_human * (lltv / WAD) >= borrowed_human
 * Solving: liqPrice = borrowed_human / (collateral_human * lltv_fraction)
 */
export function computeLiquidationPrice(params: {
  collateral: bigint
  borrowShares: bigint
  totalBorrowAssets: bigint
  totalBorrowShares: bigint
  lltv: bigint
  collateralDecimals: number
  loanDecimals: number
}): number | null {
  const { collateral, borrowShares, totalBorrowAssets, totalBorrowShares, lltv } = params
  if (collateral === 0n || lltv === 0n || borrowShares === 0n || totalBorrowShares === 0n) {
    return null
  }

  const borrowed = sharesToAssetsUp(borrowShares, totalBorrowAssets, totalBorrowShares)
  if (borrowed === 0n) {
    return null
  }

  const borrowedHuman = Number(borrowed) / 10 ** params.loanDecimals
  const collateralHuman = Number(collateral) / 10 ** params.collateralDecimals
  const lltvFraction = Number(lltv) / 1e18

  return borrowedHuman / (collateralHuman * lltvFraction)
}

export type HealthColor = 'green' | 'yellow' | 'red'

interface HealthFactorResult {
  healthFactor: number
  usagePercent: number
  hasPosition: boolean
  hasDebt: boolean
}

/**
 * Morpho Blue health factor:
 *   borrowAssets = borrowShares * totalBorrowAssets / totalBorrowShares
 *   collateralValueInLoanToken = collateral * oraclePrice / (ORACLE_PRICE_SCALE * 10^(loanDecimals - collateralDecimals))
 *   maxBorrow = collateralValueInLoanToken * lltv / 1e18
 *   healthFactor = maxBorrow / borrowAssets
 */
export function computeHealthFactor(params: {
  collateral: bigint
  borrowShares: bigint
  totalBorrowAssets: bigint
  totalBorrowShares: bigint
  oraclePrice: bigint
  lltv: bigint
  collateralDecimals: number
  loanDecimals: number
}): HealthFactorResult | null {
  const { collateral, borrowShares, totalBorrowAssets, totalBorrowShares, oraclePrice, lltv } = params

  const hasPosition = collateral > 0n || borrowShares > 0n
  if (!hasPosition) {
    return null
  }

  const hasDebt = borrowShares > 0n && totalBorrowShares > 0n

  if (!hasDebt) {
    return { healthFactor: Infinity, usagePercent: 0, hasPosition: true, hasDebt: false }
  }

  const borrowAssets = (borrowShares * totalBorrowAssets) / totalBorrowShares
  if (borrowAssets === 0n) {
    return { healthFactor: Infinity, usagePercent: 0, hasPosition: true, hasDebt: false }
  }

  const decimalAdjustment = params.loanDecimals - params.collateralDecimals
  const oracleScale = ORACLE_PRICE_SCALE * 10 ** decimalAdjustment

  const collateralValueInLoan = (Number(collateral) * Number(oraclePrice)) / oracleScale
  const maxBorrow = (collateralValueInLoan * Number(lltv)) / 1e18
  const borrowAssetsNumber = Number(borrowAssets)

  if (borrowAssetsNumber <= 0) {
    return { healthFactor: Infinity, usagePercent: 0, hasPosition: true, hasDebt: false }
  }

  const healthFactor = maxBorrow / borrowAssetsNumber
  const usagePercent = Math.min(100, (1 / healthFactor) * 100)

  return { healthFactor, usagePercent, hasPosition: true, hasDebt: true }
}

export function getHealthColor(usagePercent: number): HealthColor {
  if (usagePercent >= 85) {
    return 'red'
  }
  if (usagePercent >= 60) {
    return 'yellow'
  }
  return 'green'
}
