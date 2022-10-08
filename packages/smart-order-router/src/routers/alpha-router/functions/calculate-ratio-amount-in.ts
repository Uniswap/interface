import { Fraction } from '@uniswap/sdk-core';

import { CurrencyAmount } from '../../../util/amounts';

export function calculateRatioAmountIn(
  optimalRatio: Fraction,
  inputTokenPrice: Fraction,
  inputBalance: CurrencyAmount,
  outputBalance: CurrencyAmount
): CurrencyAmount {
  // formula: amountToSwap = (inputBalance - (optimalRatio * outputBalance)) / ((optimalRatio * inputTokenPrice) + 1))
  const amountToSwapRaw = new Fraction(inputBalance.quotient)
    .subtract(optimalRatio.multiply(outputBalance.quotient))
    .divide(optimalRatio.multiply(inputTokenPrice).add(1));

  if (amountToSwapRaw.lessThan(0)) {
    // should never happen since we do checks before calling in
    throw new Error('routeToRatio: insufficient input token amount');
  }

  return CurrencyAmount.fromRawAmount(
    inputBalance.currency,
    amountToSwapRaw.quotient
  );
}
