import { BigNumber } from '@ethersproject/bignumber'
import { Fraction, JSBI } from 'libs/sdk/src'

export const getFullDisplayBalance = (balance: BigNumber, decimals = 18, significant = 6): string => {
  return new Fraction(balance.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toSignificant(
    significant
  )
}
