import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useActiveWeb3React } from 'hooks/web3'
import JSBI from 'jsbi'

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(currencyAmount?: CurrencyAmount<Currency>): CurrencyAmount<Currency> | undefined {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { chainId } = useActiveWeb3React()

  const MIN_NATIVE_CURRENCY_FOR_GAS: JSBI =
    chainId === 1
      ? JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)) // .01 ETH
      : JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(15)) // .001 ETH

  if (!currencyAmount) return undefined
  if (currencyAmount.currency.isNative) {
    if (JSBI.greaterThan(currencyAmount.quotient, MIN_NATIVE_CURRENCY_FOR_GAS)) {
      return CurrencyAmount.fromRawAmount(
        currencyAmount.currency,
        JSBI.subtract(currencyAmount.quotient, MIN_NATIVE_CURRENCY_FOR_GAS)
      )
    } else {
      return CurrencyAmount.fromRawAmount(currencyAmount.currency, JSBI.BigInt(0))
    }
  }
  return currencyAmount
}
