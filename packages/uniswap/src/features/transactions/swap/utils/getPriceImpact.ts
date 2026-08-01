import { type Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import type { ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/chained'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isChained, isClassic, isJupiter, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { areEvmAddressesEqual } from 'uniswap/src/utils/addresses'

const EARN_DEPOSIT_ACTION = 'deposit'
const EARN_DEPOSIT_PREVIEW_TYPE = 'DEPOSIT'
const NATIVE_ASSET_ADDRESSES = [
  '0x0000000000000000000000000000000000000000',
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
] as const

function stringToUSDAmount(value: string | number | undefined, USDCurrency: Currency): Maybe<CurrencyAmount<Currency>> {
  if (!value) {
    return undefined
  }

  return getCurrencyAmount({
    value: value.toString().slice(0, USDCurrency.decimals),
    valueType: ValueType.Exact,
    currency: USDCurrency,
  })
}

/** Returns the price impact of the current trade, including UniswapX trades. UniswapX trades do not have typical pool-based price impact; we use a frontend-calculated metric. */
function getUniswapXPriceImpact({ derivedSwapInfo }: { derivedSwapInfo: DerivedSwapInfo }): Percent | undefined {
  const trade = derivedSwapInfo.trade.trade
  const { input: inputUSD, output: outputUSD } = derivedSwapInfo.currencyAmountsUSDValue

  if (!trade || !isUniswapX(trade) || !trade.quote.quote.classicGasUseEstimateUSD || !inputUSD || !outputUSD) {
    return undefined
  }

  const classicGasEstimateUSD = stringToUSDAmount(trade.quote.quote.classicGasUseEstimateUSD, inputUSD.currency)
  const swapFeeUSDString = getSwapFeeUsdFromDerivedSwapInfo(derivedSwapInfo)
  const swapFeeUSD =
    stringToUSDAmount(swapFeeUSDString, inputUSD.currency) ?? CurrencyAmount.fromRawAmount(inputUSD.currency, '0')

  if (!classicGasEstimateUSD) {
    return undefined
  }

  const result = outputUSD
    .add(classicGasEstimateUSD)
    .add(swapFeeUSD)
    .divide(inputUSD)
    .asFraction.subtract(1)
    .multiply(-1)

  return new Percent(result.numerator, result.denominator)
}

export function getPriceImpact(derivedSwapInfo: DerivedSwapInfo): Percent | undefined {
  const trade = derivedSwapInfo.trade.trade
  if (!trade) {
    return undefined
  }

  if (isUniswapX(trade)) {
    return getUniswapXPriceImpact({ derivedSwapInfo })
  } else if (isClassic(trade) || isJupiter(trade)) {
    return trade.priceImpact
  } else if (isChained(trade)) {
    return getChainedPriceImpact({ derivedSwapInfo })
  } else {
    return undefined
  }
}

/**
 * Returns a USD-based price impact for CHAINED trades.
 *
 * `ChainedActionTrade` declares `priceImpact: undefined`, so we fall back to the same shape
 * UniswapX uses: `1 - outputUSD/inputUSD` from `derivedSwapInfo.currencyAmountsUSDValue`.
 * Unlike UniswapX, we don't adjust for classic gas / swap fees here — the chained quote
 * doesn't surface a comparable classic-gas estimate.
 */
function getChainedPriceImpact({ derivedSwapInfo }: { derivedSwapInfo: DerivedSwapInfo }): Percent | undefined {
  const trade = derivedSwapInfo.trade.trade
  if (!trade || !isChained(trade)) {
    return undefined
  }

  // Earn deposits can output vault shares; only warn when display output is the underlying deposit asset.
  if (isEarnDepositTrade(trade) && !isEarnDepositPriceImpactOutputSafe(trade)) {
    return undefined
  }

  const { input: inputUSD, output: outputUSD } = derivedSwapInfo.currencyAmountsUSDValue

  if (!inputUSD || !outputUSD) {
    return undefined
  }

  const result = outputUSD.divide(inputUSD).asFraction.subtract(1).multiply(-1)

  return new Percent(result.numerator, result.denominator)
}

function isEarnDepositTrade(trade: ChainedActionTrade): boolean {
  return (trade.earnIntent?.action as string | undefined) === EARN_DEPOSIT_ACTION
}

function isEarnDepositPriceImpactOutputSafe(trade: ChainedActionTrade): boolean {
  const earnPreview = trade.quote.quote.earnPreview
  if (earnPreview?.type !== EARN_DEPOSIT_PREVIEW_TYPE) {
    return false
  }

  const depositAsset = earnPreview.depositAssets[0]
  const outputCurrency = trade.outputAmount.currency

  if (
    !depositAsset?.token ||
    !depositAsset.amount ||
    Number(depositAsset.chainId) !== outputCurrency.chainId ||
    trade.outputAmount.quotient.toString() !== depositAsset.amount
  ) {
    return false
  }

  if (outputCurrency.isNative) {
    return NATIVE_ASSET_ADDRESSES.some((nativeAddress) => areEvmAddressesEqual(nativeAddress, depositAsset.token))
  }

  return areEvmAddressesEqual(outputCurrency.address, depositAsset.token)
}
