import { getCreate2Address } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { keccak256, pack } from '@ethersproject/solidity'
import { BigintIsh, CurrencyAmount, Percent, Price, sqrt, Token } from '@ubeswap/sdk-core'
import JSBI from 'jsbi'
import invariant from 'tiny-invariant'

import {
  _1000,
  _997,
  BASIS_POINTS,
  FACTORY_ADDRESS,
  FACTORY_ADDRESS_MAP,
  FIVE,
  INIT_CODE_HASH,
  MINIMUM_LIQUIDITY,
  ONE,
  ONE_HUNDRED_PERCENT,
  ZERO,
  ZERO_PERCENT,
} from '../constants'
import { InsufficientInputAmountError, InsufficientReservesError } from '../errors'

export const computePairAddress = ({
  factoryAddress,
  tokenA,
  tokenB,
}: {
  factoryAddress: string
  tokenA: Token
  tokenB: Token
}): string => {
  const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA] // does safety checks
  return getCreate2Address(
    factoryAddress,
    keccak256(['bytes'], [pack(['address', 'address'], [token0.address, token1.address])]),
    INIT_CODE_HASH
  )
}
export class Pair {
  public readonly liquidityToken: Token
  private readonly tokenAmounts: [CurrencyAmount<Token>, CurrencyAmount<Token>]

  public static getAddress(tokenA: Token, tokenB: Token): string {
    const factoryAddress = FACTORY_ADDRESS_MAP[tokenA.chainId] ?? FACTORY_ADDRESS
    return computePairAddress({ factoryAddress, tokenA, tokenB })
  }

  public constructor(currencyAmountA: CurrencyAmount<Token>, tokenAmountB: CurrencyAmount<Token>) {
    const tokenAmounts: [CurrencyAmount<Token>, CurrencyAmount<Token>] = currencyAmountA.currency.sortsBefore(
      tokenAmountB.currency
    ) // does safety checks
      ? [currencyAmountA, tokenAmountB]
      : [tokenAmountB, currencyAmountA]
    this.liquidityToken = new Token(
      tokenAmounts[0]?.currency.chainId,
      Pair.getAddress(tokenAmounts[0].currency, tokenAmounts[1].currency),
      18,
      'ULP',
      'Ubeswap V2'
    )
    this.tokenAmounts = tokenAmounts as [CurrencyAmount<Token>, CurrencyAmount<Token>]
  }

  /**
   * Returns true if the token is either token0 or token1
   * @param token to check
   */
  public involvesToken(token: Token): boolean {
    return token.equals(this.token0) || token.equals(this.token1)
  }

  /**
   * Returns the current mid price of the pair in terms of token0, i.e. the ratio of reserve1 to reserve0
   */
  public get token0Price(): Price<Token, Token> {
    const result = this.tokenAmounts[1].divide(this.tokenAmounts[0])
    return new Price(this.token0, this.token1, result.denominator, result.numerator)
  }

  /**
   * Returns the current mid price of the pair in terms of token1, i.e. the ratio of reserve0 to reserve1
   */
  public get token1Price(): Price<Token, Token> {
    const result = this.tokenAmounts[0].divide(this.tokenAmounts[1])
    return new Price(this.token1, this.token0, result.denominator, result.numerator)
  }

  /**
   * Return the price of the given token in terms of the other token in the pair.
   * @param token token to return price of
   */
  public priceOf(token: Token): Price<Token, Token> {
    invariant(this.involvesToken(token), 'TOKEN')
    return token.equals(this.token0) ? this.token0Price : this.token1Price
  }

  /**
   * Returns the chain ID of the tokens in the pair.
   */
  public get chainId(): number {
    return this.token0.chainId
  }

  public get token0(): Token {
    return this.tokenAmounts[0].currency
  }

  public get token1(): Token {
    return this.tokenAmounts[1].currency
  }

  public get reserve0(): CurrencyAmount<Token> {
    return this.tokenAmounts[0]
  }

  public get reserve1(): CurrencyAmount<Token> {
    return this.tokenAmounts[1]
  }

  public reserveOf(token: Token): CurrencyAmount<Token> {
    invariant(this.involvesToken(token), 'TOKEN')
    return token.equals(this.token0) ? this.reserve0 : this.reserve1
  }

  /**
   * getAmountOut is the linear algebra of reserve ratio against amountIn:amountOut.
   * https://ethereum.stackexchange.com/questions/101629/what-is-math-for-uniswap-calculates-the-amountout-and-amountin-why-997-and-1000
   * has the math deduction for the reserve calculation without fee-on-transfer fees.
   *
   * With fee-on-transfer tax, intuitively it's just:
   * inputAmountWithFeeAndTax = 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn
   *                          = (1 - amountIn.sellFeesBips / 10000) * amountInWithFee
   * where amountInWithFee is the amountIn after taking out the LP fees
   * outputAmountWithTax = amountOut * (1 - amountOut.buyFeesBips / 10000)
   *
   * But we are illustrating the math deduction below to ensure that's the case.
   *
   * before swap A * B = K where A = reserveIn B = reserveOut
   *
   * after swap A' * B' = K where only k is a constant value
   *
   * getAmountOut
   *
   * A' = A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn # here 0.3% is deducted
   * B' = B - amountOut * (1 - amountOut.buyFeesBips / 10000)
   * amountOut = (B - B') / (1 - amountOut.buyFeesBips / 10000) # where A' * B' still is k
   *           = (B - K/(A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn))
   *             /
   *             (1 - amountOut.buyFeesBips / 10000)
   *           = (B - AB/(A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn))
   *             /
   *             (1 - amountOut.buyFeesBips / 10000)
   *           = ((BA + B * 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn - AB)/(A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn))
   *             /
   *             (1 - amountOut.buyFeesBips / 10000)
   *           = (B * 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn / (A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn)
   *             /
   *             (1 - amountOut.buyFeesBips / 10000)
   * amountOut * (1 - amountOut.buyFeesBips / 10000) = (B * 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn
   *                                                    /
   *                                                    (A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn)
   *
   * outputAmountWithTax = (B * 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn
   *                       /
   *                       (A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn)
   *                       = (B * 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn * 1000
   *                       /
   *                       ((A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn) * 1000)
   *                     = (B * (1 - amountIn.sellFeesBips / 10000) 997 * * amountIn
   *                       /
   *                       (1000 * A + (1 - amountIn.sellFeesBips / 10000) * 997 * amountIn)
   *                     = (B * (1 - amountIn.sellFeesBips / 10000) * inputAmountWithFee)
   *                       /
   *                       (1000 * A + (1 - amountIn.sellFeesBips / 10000) * inputAmountWithFee)
   *                     = (B * inputAmountWithFeeAndTax)
   *                       /
   *                       (1000 * A + inputAmountWithFeeAndTax)
   *
   * inputAmountWithFeeAndTax = (1 - amountIn.sellFeesBips / 10000) * inputAmountWithFee
   * outputAmountWithTax = amountOut * (1 - amountOut.buyFeesBips / 10000)
   *
   * @param inputAmount
   * @param calculateFotFees
   */
  public getOutputAmount(
    inputAmount: CurrencyAmount<Token>,
    calculateFotFees: boolean = true
  ): [CurrencyAmount<Token>, Pair] {
    invariant(this.involvesToken(inputAmount.currency), 'TOKEN')
    if (JSBI.equal(this.reserve0.quotient, ZERO) || JSBI.equal(this.reserve1.quotient, ZERO)) {
      throw new InsufficientReservesError()
    }
    const inputReserve = this.reserveOf(inputAmount.currency)
    const outputReserve = this.reserveOf(inputAmount.currency.equals(this.token0) ? this.token1 : this.token0)

    const percentAfterSellFees = calculateFotFees ? this.derivePercentAfterSellFees(inputAmount) : ZERO_PERCENT
    const inputAmountAfterTax = percentAfterSellFees.greaterThan(ZERO_PERCENT)
      ? CurrencyAmount.fromRawAmount(
          inputAmount.currency,
          percentAfterSellFees.multiply(inputAmount).quotient // fraction.quotient will round down by itself, which is desired
        )
      : inputAmount

    const inputAmountWithFeeAndAfterTax = JSBI.multiply(inputAmountAfterTax.quotient, _997)
    const numerator = JSBI.multiply(inputAmountWithFeeAndAfterTax, outputReserve.quotient)
    const denominator = JSBI.add(JSBI.multiply(inputReserve.quotient, _1000), inputAmountWithFeeAndAfterTax)
    const outputAmount = CurrencyAmount.fromRawAmount(
      inputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
      JSBI.divide(numerator, denominator) // JSBI.divide will round down by itself, which is desired
    )

    if (JSBI.equal(outputAmount.quotient, ZERO)) {
      throw new InsufficientInputAmountError()
    }

    const percentAfterBuyFees = calculateFotFees ? this.derivePercentAfterBuyFees(outputAmount) : ZERO_PERCENT
    const outputAmountAfterTax = percentAfterBuyFees.greaterThan(ZERO_PERCENT)
      ? CurrencyAmount.fromRawAmount(
          outputAmount.currency,
          outputAmount.multiply(percentAfterBuyFees).quotient // fraction.quotient will round down by itself, which is desired
        )
      : outputAmount
    if (JSBI.equal(outputAmountAfterTax.quotient, ZERO)) {
      throw new InsufficientInputAmountError()
    }

    return [
      outputAmountAfterTax,
      new Pair(inputReserve.add(inputAmountAfterTax), outputReserve.subtract(outputAmountAfterTax)),
    ]
  }

  /**
   * getAmountIn is the linear algebra of reserve ratio against amountIn:amountOut.
   * https://ethereum.stackexchange.com/questions/101629/what-is-math-for-uniswap-calculates-the-amountout-and-amountin-why-997-and-1000
   * has the math deduction for the reserve calculation without fee-on-transfer fees.
   *
   * With fee-on-transfer fees, intuitively it's just:
   * outputAmountWithTax = amountOut / (1 - amountOut.buyFeesBips / 10000)
   * inputAmountWithTax = amountIn / (1 - amountIn.sellFeesBips / 10000) / 0.997
   *
   * But we are illustrating the math deduction below to ensure that's the case.
   *
   * before swap A * B = K where A = reserveIn B = reserveOut
   *
   * after swap A' * B' = K where only k is a constant value
   *
   * getAmountIn
   *
   * B' = B - amountOut * (1 - amountOut.buyFeesBips / 10000)
   * A' = A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn # here 0.3% is deducted
   * amountIn = (A' - A) / (0.997 * (1 - amountIn.sellFeesBips / 10000))
   *          = (K / (B - amountOut / (1 - amountOut.buyFeesBips / 10000)) - A)
   *            /
   *            (0.997 * (1 - amountIn.sellFeesBips / 10000))
   *          = (AB / (B - amountOut / (1 - amountOut.buyFeesBips / 10000)) - A)
   *            /
   *            (0.997 * (1 - amountIn.sellFeesBips / 10000))
   *          = ((AB - AB + A * amountOut / (1 - amountOut.buyFeesBips / 10000)) / (B - amountOut / (1 - amountOut.buyFeesBips / 10000)))
   *            /
   *            (0.997 * (1 - amountIn.sellFeesBips / 10000))
   *          = ((A * amountOut / (1 - amountOut.buyFeesBips / 10000)) / (B - amountOut / (1 - amountOut.buyFeesBips / 10000)))
   *            /
   *            (0.997 * (1 - amountIn.sellFeesBips / 10000))
   *          = ((A * 1000 * amountOut / (1 - amountOut.buyFeesBips / 10000)) / (B - amountOut / (1 - amountOut.buyFeesBips / 10000)))
   *            /
   *            (997 * (1 - amountIn.sellFeesBips / 10000))
   *
   * outputAmountWithTax = amountOut / (1 - amountOut.buyFeesBips / 10000)
   * inputAmountWithTax = amountIn / (997 * (1 - amountIn.sellFeesBips / 10000))
   *                    = (A * outputAmountWithTax * 1000) / ((B - outputAmountWithTax) * 997)
   *
   * @param outputAmount
   */
  public getInputAmount(
    outputAmount: CurrencyAmount<Token>,
    calculateFotFees: boolean = true
  ): [CurrencyAmount<Token>, Pair] {
    invariant(this.involvesToken(outputAmount.currency), 'TOKEN')
    const percentAfterBuyFees = calculateFotFees ? this.derivePercentAfterBuyFees(outputAmount) : ZERO_PERCENT
    const outputAmountBeforeTax = percentAfterBuyFees.greaterThan(ZERO_PERCENT)
      ? CurrencyAmount.fromRawAmount(
          outputAmount.currency,
          JSBI.add(outputAmount.divide(percentAfterBuyFees).quotient, ONE) // add 1 for rounding up
        )
      : outputAmount

    if (
      JSBI.equal(this.reserve0.quotient, ZERO) ||
      JSBI.equal(this.reserve1.quotient, ZERO) ||
      JSBI.greaterThanOrEqual(outputAmount.quotient, this.reserveOf(outputAmount.currency).quotient) ||
      JSBI.greaterThanOrEqual(outputAmountBeforeTax.quotient, this.reserveOf(outputAmount.currency).quotient)
    ) {
      throw new InsufficientReservesError()
    }

    const outputReserve = this.reserveOf(outputAmount.currency)
    const inputReserve = this.reserveOf(outputAmount.currency.equals(this.token0) ? this.token1 : this.token0)

    const numerator = JSBI.multiply(JSBI.multiply(inputReserve.quotient, outputAmountBeforeTax.quotient), _1000)
    const denominator = JSBI.multiply(JSBI.subtract(outputReserve.quotient, outputAmountBeforeTax.quotient), _997)
    const inputAmount = CurrencyAmount.fromRawAmount(
      outputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
      JSBI.add(JSBI.divide(numerator, denominator), ONE) // add 1 here is part of the formula, no rounding needed here, since there will not be decimal at this point
    )

    const percentAfterSellFees = calculateFotFees ? this.derivePercentAfterSellFees(inputAmount) : ZERO_PERCENT
    const inputAmountBeforeTax = percentAfterSellFees.greaterThan(ZERO_PERCENT)
      ? CurrencyAmount.fromRawAmount(
          inputAmount.currency,
          JSBI.add(inputAmount.divide(percentAfterSellFees).quotient, ONE) // add 1 for rounding up
        )
      : inputAmount
    return [inputAmountBeforeTax, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))]
  }

  public getLiquidityMinted(
    totalSupply: CurrencyAmount<Token>,
    tokenAmountA: CurrencyAmount<Token>,
    tokenAmountB: CurrencyAmount<Token>
  ): CurrencyAmount<Token> {
    invariant(totalSupply.currency.equals(this.liquidityToken), 'LIQUIDITY')
    const tokenAmounts: [CurrencyAmount<Token>, CurrencyAmount<Token>] = tokenAmountA.currency.sortsBefore(
      tokenAmountB.currency
    ) // does safety checks
      ? [tokenAmountA, tokenAmountB]
      : [tokenAmountB, tokenAmountA]
    invariant(tokenAmounts[0].currency.equals(this.token0) && tokenAmounts[1].currency.equals(this.token1), 'TOKEN')

    let liquidity: JSBI
    if (JSBI.equal(totalSupply.quotient, ZERO)) {
      liquidity = JSBI.subtract(
        sqrt(JSBI.multiply(tokenAmounts[0].quotient, tokenAmounts[1].quotient)),
        MINIMUM_LIQUIDITY
      )
    } else {
      const amount0 = JSBI.divide(JSBI.multiply(tokenAmounts[0].quotient, totalSupply.quotient), this.reserve0.quotient)
      const amount1 = JSBI.divide(JSBI.multiply(tokenAmounts[1].quotient, totalSupply.quotient), this.reserve1.quotient)
      liquidity = JSBI.lessThanOrEqual(amount0, amount1) ? amount0 : amount1
    }
    if (!JSBI.greaterThan(liquidity, ZERO)) {
      throw new InsufficientInputAmountError()
    }
    return CurrencyAmount.fromRawAmount(this.liquidityToken, liquidity)
  }

  public getLiquidityValue(
    token: Token,
    totalSupply: CurrencyAmount<Token>,
    liquidity: CurrencyAmount<Token>,
    feeOn: boolean = false,
    kLast?: BigintIsh
  ): CurrencyAmount<Token> {
    invariant(this.involvesToken(token), 'TOKEN')
    invariant(totalSupply.currency.equals(this.liquidityToken), 'TOTAL_SUPPLY')
    invariant(liquidity.currency.equals(this.liquidityToken), 'LIQUIDITY')
    invariant(JSBI.lessThanOrEqual(liquidity.quotient, totalSupply.quotient), 'LIQUIDITY')

    let totalSupplyAdjusted: CurrencyAmount<Token>
    if (!feeOn) {
      totalSupplyAdjusted = totalSupply
    } else {
      invariant(!!kLast, 'K_LAST')
      const kLastParsed = JSBI.BigInt(kLast)
      if (!JSBI.equal(kLastParsed, ZERO)) {
        const rootK = sqrt(JSBI.multiply(this.reserve0.quotient, this.reserve1.quotient))
        const rootKLast = sqrt(kLastParsed)
        if (JSBI.greaterThan(rootK, rootKLast)) {
          const numerator = JSBI.multiply(totalSupply.quotient, JSBI.subtract(rootK, rootKLast))
          const denominator = JSBI.add(JSBI.multiply(rootK, FIVE), rootKLast)
          const feeLiquidity = JSBI.divide(numerator, denominator)
          totalSupplyAdjusted = totalSupply.add(CurrencyAmount.fromRawAmount(this.liquidityToken, feeLiquidity))
        } else {
          totalSupplyAdjusted = totalSupply
        }
      } else {
        totalSupplyAdjusted = totalSupply
      }
    }

    return CurrencyAmount.fromRawAmount(
      token,
      JSBI.divide(JSBI.multiply(liquidity.quotient, this.reserveOf(token).quotient), totalSupplyAdjusted.quotient)
    )
  }

  private derivePercentAfterSellFees(inputAmount: CurrencyAmount<Token>): Percent {
    const sellFeeBips = this.token0.wrapped.equals(inputAmount.wrapped.currency)
      ? this.token0.wrapped.sellFeeBps
      : this.token1.wrapped.sellFeeBps
    if (sellFeeBips?.gt(BigNumber.from(0))) {
      return ONE_HUNDRED_PERCENT.subtract(new Percent(JSBI.BigInt(sellFeeBips)).divide(BASIS_POINTS))
    } else {
      return ZERO_PERCENT
    }
  }

  private derivePercentAfterBuyFees(outputAmount: CurrencyAmount<Token>): Percent {
    const buyFeeBps = this.token0.wrapped.equals(outputAmount.wrapped.currency)
      ? this.token0.wrapped.buyFeeBps
      : this.token1.wrapped.buyFeeBps
    if (buyFeeBps?.gt(BigNumber.from(0))) {
      return ONE_HUNDRED_PERCENT.subtract(new Percent(JSBI.BigInt(buyFeeBps)).divide(BASIS_POINTS))
    } else {
      return ZERO_PERCENT
    }
  }
}
