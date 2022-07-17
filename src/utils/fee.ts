import { CurrencyAmount, Fraction, Currency } from '@kyberswap/ks-sdk-core'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import { BIPS_BASE, RESERVE_USD_DECIMALS } from 'constants/index'
import { Aggregator } from 'utils/aggregator'
import { formattedNum } from 'utils/index'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'

// This function is not correct, the result will be rounded.
// Eg. 0.9999 (amountIn) * 0.0008 (fee bps currency_in) = 0.000799 (round 6 number, for example, swap from usdt)
// => amount without fee in = 0.9999 - 0.000799 = 0.999101
// We have amountPlusFee = 0.999101 / (1 - 0.0008) = 0.9999009207 => Wrong.
// TODO nguyenhuudungz: Delete this function and logic of encoding in frontend after releasing it in backend.
export function getAmountPlusFeeInQuotient(
  amount: CurrencyAmount<Currency> | string,
  feeConfig: FeeConfig | undefined,
) {
  let amountPlusFee = new Fraction(typeof amount === 'string' ? amount : amount.quotient, JSBI.BigInt(1))

  if (feeConfig) {
    if (feeConfig.isInBps) {
      const feeAmountBpsDecimal = new Fraction(feeConfig.feeAmount).divide(BIPS_BASE)
      const feeAmountDecimal = amountPlusFee.multiply(feeAmountBpsDecimal).quotient
      amountPlusFee = amountPlusFee.add(feeAmountDecimal)
    } else {
      amountPlusFee = amountPlusFee.add(feeConfig.feeAmount)
    }
  }

  return amountPlusFee.quotient.toString()
}

/**
 * Get Fee Amount in a Trade (unit: USD)
 * @param trade
 * @param feeConfig
 */
export function getFormattedFeeAmountUsd(trade: Aggregator, feeConfig: FeeConfig | undefined) {
  if (feeConfig) {
    const amountInUsd = new Fraction(
      parseUnits(trade.amountInUsd.toString(), RESERVE_USD_DECIMALS).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
    )
    // feeAmount might < 1.
    const feeAmountFraction = new Fraction(
      parseUnits(feeConfig.feeAmount, RESERVE_USD_DECIMALS).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
    )
    const feeAmountDecimal = feeAmountFraction.divide(BIPS_BASE)
    if (amountInUsd) {
      const feeAmountUsd = amountInUsd.multiply(feeAmountDecimal).toSignificant(RESERVE_USD_DECIMALS)
      return formattedNum(feeAmountUsd, true)
    }
  }

  return '--'
}
