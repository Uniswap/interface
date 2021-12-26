import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { Pair as PairOrigin } from '@uniswap/v2-sdk'

import { V2_FACTORY_ADDRESSES } from '../constants/addresses'
import { computePairAddress } from '../utils/computePairAddress'

export class Pair extends PairOrigin {
  public readonly liquidityToken: Token

  public static getAddress(tokenA: Token, tokenB: Token): string {
    return computePairAddress({ factoryAddress: V2_FACTORY_ADDRESSES[tokenA.chainId], tokenA, tokenB })
  }

  public constructor(currencyAmountA: CurrencyAmount<Token>, tokenAmountB: CurrencyAmount<Token>) {
    super(currencyAmountA, tokenAmountB)
    const tokenAmounts = currencyAmountA.currency.sortsBefore(tokenAmountB.currency) // does safety checks
      ? [currencyAmountA, tokenAmountB]
      : [tokenAmountB, currencyAmountA]
    this.liquidityToken = new Token(
      tokenAmounts[0].currency.chainId,
      Pair.getAddress(tokenAmounts[0].currency, tokenAmounts[1].currency),
      18,
      'XSP-V1',
      'XSwapProtocol V1'
    )
  }
}
