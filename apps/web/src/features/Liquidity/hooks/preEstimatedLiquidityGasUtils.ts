import { Currency } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { maxLiquidityForAmounts, TickMath, Pool as V3Pool, Position as V3Position } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import {
  DynamicConfigs,
  LiquidityApprovalSimulationConfigKey,
  LiquidityGasPreEstimationConfigKey,
  useDynamicConfigValue,
} from '@universe/gating'
import JSBI from 'jsbi'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { wrappedNativeCurrency } from 'uniswap/src/utils/currency'

/** Fallback when balance is unknown or no amount yields non-zero liquidity client-side. */
export const DUMMY_AMOUNT = '1'

const MAX_UINT128 = JSBI.subtract(JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)), JSBI.BigInt(1))

const ZERO = JSBI.BigInt(0)
const TWO = JSBI.BigInt(2)

type V3LikeLiquidityInput = {
  pool: V3Pool | V4Pool
  tickLower: number
  tickUpper: number
  independentIsToken0: boolean
  amount: JSBI
}

/**
 * Replicates the backend's exact liquidity computation path:
 * - Out-of-range: useFullPrecision=true (matches backend rounding)
 * - In-range: compute dependent amount via Position.fromAmount0/1 (integer truncation matching
 *   backend's parseUnits(toExact())), then recompute liquidity with both actual amounts and
 *   useFullPrecision=true. This prevents ZERO_LIQUIDITY errors where the backend computes
 *   dependent=0 for tiny independent amounts.
 */
function liquidityForIndependentAmountV3Like(input: V3LikeLiquidityInput): JSBI {
  const { pool, tickLower, tickUpper, independentIsToken0, amount } = input
  if (tickLower >= tickUpper) {
    // Degenerate range: maxLiquidityForAmounts would divide by zero
    return ZERO
  }
  const sqrtRatioX96 = pool.sqrtRatioX96
  const sqrtRatioA = TickMath.getSqrtRatioAtTick(tickLower)
  const sqrtRatioB = TickMath.getSqrtRatioAtTick(tickUpper)

  if (JSBI.greaterThanOrEqual(sqrtRatioX96, sqrtRatioB)) {
    if (!independentIsToken0) {
      return maxLiquidityForAmounts(sqrtRatioX96, sqrtRatioA, sqrtRatioB, ZERO, amount, true)
    }
    return ZERO
  }

  if (JSBI.lessThan(sqrtRatioX96, sqrtRatioA)) {
    if (independentIsToken0) {
      return maxLiquidityForAmounts(sqrtRatioX96, sqrtRatioA, sqrtRatioB, amount, ZERO, true)
    }
    return ZERO
  }

  // In-range: replicate backend path (compute dependent, then recompute with both amounts)
  try {
    if (independentIsToken0) {
      const dependent =
        pool instanceof V3Pool
          ? V3Position.fromAmount0({ pool, tickLower, tickUpper, amount0: amount, useFullPrecision: true }).amount1
              .quotient
          : V4Position.fromAmount0({ pool, tickLower, tickUpper, amount0: amount, useFullPrecision: true }).amount1
              .quotient
      return maxLiquidityForAmounts(sqrtRatioX96, sqrtRatioA, sqrtRatioB, amount, dependent, true)
    } else {
      const dependent =
        pool instanceof V3Pool
          ? V3Position.fromAmount1({ pool, tickLower, tickUpper, amount1: amount }).amount0.quotient
          : V4Position.fromAmount1({ pool, tickLower, tickUpper, amount1: amount }).amount0.quotient
      return maxLiquidityForAmounts(sqrtRatioX96, sqrtRatioA, sqrtRatioB, dependent, amount, true)
    }
  } catch {
    return ZERO
  }
}

type QuoteReserveInput = {
  amountIndependent: JSBI
  reserveIndependent: JSBI
  reserveOther: JSBI
}

function quoteReserve(input: QuoteReserveInput): JSBI {
  const { amountIndependent, reserveIndependent, reserveOther } = input
  if (JSBI.equal(reserveIndependent, ZERO)) {
    return ZERO
  }
  return JSBI.divide(JSBI.multiply(amountIndependent, reserveOther), reserveIndependent)
}

type V2LiquidityInput = {
  pair: Pair
  independentCurrency: Currency
  independentAmount: JSBI
}

function liquidityForIndependentAmountV2(input: V2LiquidityInput): JSBI {
  const { pair, independentCurrency, independentAmount } = input
  const token0 = pair.token0
  const wrappedIndep = independentCurrency.wrapped
  const isToken0 = wrappedIndep.equals(token0)

  const r0 = pair.reserve0.quotient
  const r1 = pair.reserve1.quotient

  const amount0 = isToken0
    ? independentAmount
    : quoteReserve({ amountIndependent: independentAmount, reserveIndependent: r1, reserveOther: r0 })
  const amount1 = isToken0
    ? quoteReserve({ amountIndependent: independentAmount, reserveIndependent: r0, reserveOther: r1 })
    : independentAmount

  // For pre-estimation we only need to verify the dependent amount is non-zero, meaning the
  // backend (which has the real totalSupply) won't hit a ZERO_LIQUIDITY error. We intentionally
  // skip getLiquidityMinted here because we don't have the real totalSupply — using a dummy value
  // of '1' causes integer truncation (amount * 1 / reserve → 0) for any amount smaller than the
  // reserve, inflating the pre-estimate amount to unreasonably large values (e.g. 104 BTC).
  if (!JSBI.greaterThan(amount0, ZERO) || !JSBI.greaterThan(amount1, ZERO)) {
    return ZERO
  }

  return JSBI.BigInt(1)
}

/**
 * Find a minimal independent amount: start at 10^(decimals/2) and double if needed.
 * Starting at a reasonable amount (e.g. 10^9 wei for 18-decimal token) means this almost
 * always converges in 1 iteration instead of 30+ when starting from 1 wei.
 */
function findMinimalPreEstimateIndependentAmountRaw(liquidityFn: (amount: JSBI) => JSBI, decimals: number): string {
  const startExp = Math.floor(decimals / 2)
  let amount = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(startExp))
  for (let i = 0; i < 64; i++) {
    if (JSBI.greaterThan(liquidityFn(amount), ZERO)) {
      return amount.toString()
    }
    amount = JSBI.multiply(amount, TWO)
    if (JSBI.greaterThan(amount, MAX_UINT128)) {
      break
    }
  }

  return DUMMY_AMOUNT
}

function computePreEstimateAmountRawFor({
  poolOrPair,
  tickLower,
  tickUpper,
  token0,
  independentCurrency,
}: {
  poolOrPair: V3Pool | V4Pool | Pair
  tickLower: number | undefined
  tickUpper: number | undefined
  token0: Currency
  independentCurrency: Currency
}): string {
  const independentIsToken0 = independentCurrency.wrapped.equals(token0.wrapped)

  if (poolOrPair instanceof Pair) {
    return findMinimalPreEstimateIndependentAmountRaw(
      (amount) =>
        liquidityForIndependentAmountV2({
          pair: poolOrPair,
          independentCurrency,
          independentAmount: amount,
        }),
      independentCurrency.decimals,
    )
  }

  if (tickLower == null || tickUpper == null) {
    return DUMMY_AMOUNT
  }

  return findMinimalPreEstimateIndependentAmountRaw(
    (amount) =>
      liquidityForIndependentAmountV3Like({
        pool: poolOrPair,
        tickLower,
        tickUpper,
        independentIsToken0,
        amount,
      }),
    independentCurrency.decimals,
  )
}

export type PreEstimateIndependentAmountResult = {
  amountRaw: string
  independentCurrency: Currency
}

/**
 * Tries both tokens as independent and picks the one that produces a valid (non-DUMMY) amount
 * at the smallest raw value — least risk of triggering balance/simulation issues. Falls back to
 * DUMMY_AMOUNT with the lower-decimal token when neither yields a valid amount.
 */
export function computePreEstimateIndependentAmount({
  poolOrPair,
  tickLower,
  tickUpper,
  token0,
  token1,
}: {
  poolOrPair: V3Pool | V4Pool | Pair
  tickLower: number | undefined
  tickUpper: number | undefined
  token0: Currency
  token1: Currency
}): PreEstimateIndependentAmountResult {
  const amount0 = computePreEstimateAmountRawFor({
    poolOrPair,
    tickLower,
    tickUpper,
    token0,
    independentCurrency: token0,
  })
  const amount1 = computePreEstimateAmountRawFor({
    poolOrPair,
    tickLower,
    tickUpper,
    token0,
    independentCurrency: token1,
  })

  if (amount0 === DUMMY_AMOUNT && amount1 === DUMMY_AMOUNT) {
    return { amountRaw: DUMMY_AMOUNT, independentCurrency: token0.decimals <= token1.decimals ? token0 : token1 }
  }

  if (amount0 === DUMMY_AMOUNT) {
    return { amountRaw: amount1, independentCurrency: token1 }
  }
  if (amount1 === DUMMY_AMOUNT) {
    return { amountRaw: amount0, independentCurrency: token0 }
  }

  // Both valid — pick the numerically smaller amount (stays tiny, less risk of balance issues)
  if (JSBI.lessThanOrEqual(JSBI.BigInt(amount0), JSBI.BigInt(amount1))) {
    return { amountRaw: amount0, independentCurrency: token0 }
  }
  return { amountRaw: amount1, independentCurrency: token1 }
}

/**
 * V2/V3 pools use wrapped native (e.g. WETH) while the interface often shows native ETH.
 */
export function currencyIsNativeOrWrappedNative(currency: Currency, chainId: number): boolean {
  if (currency.isNative) {
    return true
  }
  const wrapped = wrappedNativeCurrency(chainId as UniverseChainId)
  return wrapped ? currency.wrapped.equals(wrapped) : false
}

export type LiquidityPreEstimatePoolTokens = {
  token0: Currency | null | undefined
  token1: Currency | null | undefined
  chainId: number | undefined
}

export function poolHasNativeOrWrappedNativeSide({ token0, token1, chainId }: LiquidityPreEstimatePoolTokens): boolean {
  if (chainId == null || !token0 || !token1) {
    return false
  }
  return currencyIsNativeOrWrappedNative(token0, chainId) || currencyIsNativeOrWrappedNative(token1, chainId)
}

/** Default enabled chains when dynamic config is unavailable; matches isSimulateV1Supported in unirpc-v2. */
const LIQUIDITY_SIMULATE_V1_DEFAULT_ENABLED_CHAIN_IDS = [
  UniverseChainId.Mainnet,
  UniverseChainId.Optimism,
  UniverseChainId.Bnb,
  UniverseChainId.Unichain,
  UniverseChainId.WorldChain,
  UniverseChainId.UnichainSepolia,
  UniverseChainId.Base,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Celo,
  UniverseChainId.Sepolia,
] as number[]

export function useIsLiquidityGasPreEstimationEnabled(chainId: number | undefined): boolean {
  const enabledChainIds = useDynamicConfigValue({
    config: DynamicConfigs.LiquidityGasPreEstimation,
    key: LiquidityGasPreEstimationConfigKey.EnabledChainIds,
    defaultValue: LIQUIDITY_SIMULATE_V1_DEFAULT_ENABLED_CHAIN_IDS,
  })

  if (!chainId) {
    return false
  }

  return (enabledChainIds as number[]).includes(chainId)
}

export function useIsLiquidityApprovalSimulationEnabled(chainId: number | undefined): boolean {
  const enabledChainIds = useDynamicConfigValue({
    config: DynamicConfigs.LiquidityApprovalSimulation,
    key: LiquidityApprovalSimulationConfigKey.EnabledChainIds,
    defaultValue: LIQUIDITY_SIMULATE_V1_DEFAULT_ENABLED_CHAIN_IDS,
  })

  if (!chainId) {
    return false
  }

  return (enabledChainIds as number[]).includes(chainId)
}
