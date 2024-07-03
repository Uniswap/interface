import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

const NATIVE_CURRENCY_DECIMALS = 18

// TODO(MOB-181): calculate this in a more scientific way
export const MIN_ETH_FOR_GAS: JSBI = JSBI.multiply(
  JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(NATIVE_CURRENCY_DECIMALS - 3)),
  JSBI.BigInt(15),
) // .015 ETH

export const MIN_POLYGON_FOR_GAS: JSBI = JSBI.multiply(
  JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(NATIVE_CURRENCY_DECIMALS - 2)),
  JSBI.BigInt(6),
) // .06 MATIC

export const MIN_ARBITRUM_FOR_GAS: JSBI = JSBI.multiply(
  JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(NATIVE_CURRENCY_DECIMALS - 4)),
  JSBI.BigInt(8),
) // .0008 ETH

export const MIN_OPTIMISM_FOR_GAS: JSBI = MIN_ARBITRUM_FOR_GAS

export const MIN_BASE_FOR_GAS: JSBI = MIN_ARBITRUM_FOR_GAS

export const MIN_BNB_FOR_GAS: JSBI = MIN_ARBITRUM_FOR_GAS

export const MIN_BLAST_FOR_GAS: JSBI = MIN_ARBITRUM_FOR_GAS

export const MIN_AVALANCHE_FOR_GAS: JSBI = MIN_ARBITRUM_FOR_GAS // TODO: find better estimates for Avalanche, Celo & Zora

export const MIN_CELO_FOR_GAS: JSBI = MIN_ARBITRUM_FOR_GAS

export const MIN_ZORA_FOR_GAS: JSBI = MIN_ARBITRUM_FOR_GAS

export const MIN_ZKSYNC_FOR_GAS: JSBI = MIN_ARBITRUM_FOR_GAS

/**
 * Given some token amount, return the max that can be spent of it
 * https://github.com/Uniswap/interface/blob/main/src/utils/maxAmountSpend.ts
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(currencyAmount: Maybe<CurrencyAmount<Currency>>): Maybe<CurrencyAmount<Currency>> {
  if (!currencyAmount) {
    return undefined
  }
  if (!currencyAmount.currency.isNative) {
    return currencyAmount
  }

  let minAmount
  switch (currencyAmount.currency.chainId) {
    case UniverseChainId.Mainnet:
      minAmount = MIN_ETH_FOR_GAS
      break
    case UniverseChainId.Polygon:
      minAmount = MIN_POLYGON_FOR_GAS
      break
    case UniverseChainId.ArbitrumOne:
      minAmount = MIN_ARBITRUM_FOR_GAS
      break
    case UniverseChainId.Optimism:
      minAmount = MIN_OPTIMISM_FOR_GAS
      break
    case UniverseChainId.Base:
      minAmount = MIN_BASE_FOR_GAS
      break
    case UniverseChainId.Bnb:
      minAmount = MIN_BNB_FOR_GAS
      break
    case UniverseChainId.Blast:
      minAmount = MIN_BLAST_FOR_GAS
      break
    case UniverseChainId.Avalanche:
      minAmount = MIN_AVALANCHE_FOR_GAS
      break
    case UniverseChainId.Celo:
      minAmount = MIN_CELO_FOR_GAS
      break
    case UniverseChainId.Zora:
      minAmount = MIN_ZORA_FOR_GAS
      break
    case UniverseChainId.Zksync:
      minAmount = MIN_ZKSYNC_FOR_GAS
      break
    default:
      return undefined
  }

  // If amount is negative then set it to 0
  const amount = JSBI.greaterThan(currencyAmount.quotient, minAmount)
    ? JSBI.subtract(currencyAmount.quotient, minAmount).toString()
    : '0'

  return getCurrencyAmount({
    value: amount,
    valueType: ValueType.Raw,
    currency: currencyAmount.currency,
  })
}
