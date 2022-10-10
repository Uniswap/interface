import { BigintIsh, Price, sqrt, Token, CurrencyAmount } from '@uniswap/sdk-core'
import invariant from 'tiny-invariant'
import JSBI from 'jsbi'
import { pack, keccak256 } from '@ethersproject/solidity'
import { getCreate2Address } from '@ethersproject/address'

import {
  FACTORY_ADDRESS,
  INIT_CODE_HASH,
  MINIMUM_LIQUIDITY,
  FIVE,
  _997,
  _1000,
  ONE,
  ZERO,
  _9999,
  _1e18, _1e54, _1e36, _10000
} from '../constants'
import { InsufficientReservesError, InsufficientInputAmountError } from '../errors'

export const computePairAddress = ({
  factoryAddress,
  tokenA,
  tokenB,
  stable
}: {
  factoryAddress: string
  tokenA: Token
  tokenB: Token
  stable: boolean
}): string => {
  const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA] // does safety checks
  return getCreate2Address(
    factoryAddress,
    keccak256(['bytes'], [pack(['address', 'address', 'bool'], [token0.address, token1.address, stable])]),
    INIT_CODE_HASH
  )
}
export class Pair {
  public readonly liquidityToken: Token
  private readonly tokenAmounts: [CurrencyAmount<Token>, CurrencyAmount<Token>]
  public readonly stable: boolean

  public static getAddress(tokenA: Token, tokenB: Token, stable: boolean = false): string {
    return computePairAddress({ factoryAddress: FACTORY_ADDRESS, tokenA, tokenB, stable })
  }

  public constructor(currencyAmountA: CurrencyAmount<Token>, tokenAmountB: CurrencyAmount<Token>, stable: boolean = false) {
    const tokenAmounts = currencyAmountA.currency.sortsBefore(tokenAmountB.currency) // does safety checks
      ? [currencyAmountA, tokenAmountB]
      : [tokenAmountB, currencyAmountA]
    this.liquidityToken = new Token(
      tokenAmounts[0].currency.chainId,
      Pair.getAddress(tokenAmounts[0].currency, tokenAmounts[1].currency, stable),
      18,
      'UNI-V2',
      'Uniswap V2'
    )
    this.tokenAmounts = tokenAmounts as [CurrencyAmount<Token>, CurrencyAmount<Token>]
    this.stable = stable
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

  // x0 * (y * y / 1e18 * y / 1e18) / 1e18 + (x0 * x0 / 1e18 * x0 / 1e18) * y / 1e18;
  private _f(x0: JSBI, y: JSBI): JSBI {
    const _y3 = JSBI.divide(JSBI.multiply(JSBI.multiply(y, y), y), _1e36)
    const _x3 = JSBI.divide(JSBI.multiply(JSBI.multiply(x0, x0), x0), _1e36)
    const a = JSBI.divide(JSBI.multiply(x0, _y3), _1e18)
    const b = JSBI.divide(JSBI.multiply(y, _x3), _1e18)
    return JSBI.add(a, b)
  }

  // 3 * x0 * y^2 + x0^3
  private _d(x0: JSBI, y: JSBI): JSBI {
    const _y2 = JSBI.divide(JSBI.multiply(y, y), _1e18)
    const _x3 = JSBI.divide(JSBI.multiply(JSBI.multiply(x0, x0), x0), _1e36)
    const a = JSBI.divide(JSBI.multiply(JSBI.multiply(JSBI.BigInt(3), x0), _y2), _1e18)
    return JSBI.add(a, _x3)
  }

  private getY(x0: JSBI, xy: JSBI, y: JSBI): JSBI {
    for (let i = 0; i < 255; i++) {
      const prevY = y
      const k = this._f(x0, y)
      if (JSBI.lessThan(k, xy)) {
        const dy = JSBI.divide(JSBI.multiply(JSBI.subtract(xy, k), _1e18), this._d(x0, y))
        y = JSBI.add(y, dy)
      }else {
        const dy = JSBI.divide(JSBI.multiply(JSBI.subtract(k, xy), _1e18), this._d(x0, y))
        y = JSBI.subtract(y, dy)
      }
      if (JSBI.greaterThan(y, prevY)) {
        if (JSBI.lessThanOrEqual((JSBI.subtract(y, prevY)), JSBI.BigInt(1))) {
          return y
        }
      }else {
        if (JSBI.lessThanOrEqual((JSBI.subtract(prevY, y)), JSBI.BigInt(1))) {
          return y
        }
      }
    }
    return y
  }

  private getStableK(x: JSBI, y: JSBI, decimalIn: JSBI, decimalOut: JSBI): JSBI {
    const _x = JSBI.divide(JSBI.multiply(x, _1e18), decimalIn)
    const _y = JSBI.divide(JSBI.multiply(y, _1e18), decimalOut)
    const _a = JSBI.divide(JSBI.multiply(_x, _y), _1e18)
    const _b = JSBI.add(
        JSBI.divide(JSBI.multiply(_x, _x), _1e18),
        JSBI.divide(JSBI.multiply(_y, _y), _1e18),
    )
    return JSBI.divide(JSBI.multiply(_a, _b), _1e18)
  }

  public getOutputAmount(inputAmount: CurrencyAmount<Token>): [CurrencyAmount<Token>, Pair] {
    invariant(this.involvesToken(inputAmount.currency), 'TOKEN')
    if (JSBI.equal(this.reserve0.quotient, ZERO) || JSBI.equal(this.reserve1.quotient, ZERO)) {
      throw new InsufficientReservesError()
    }
    const inputReserve = this.reserveOf(inputAmount.currency)
    const outputReserve = this.reserveOf(inputAmount.currency.equals(this.token0) ? this.token1 : this.token0)
    if (this.stable) {
      let inputAmountWithFee = JSBI.divide(JSBI.multiply(inputAmount.numerator, _9999), _10000)
      const decimalIn = JSBI.BigInt(10**(inputReserve.currency.equals(this.token0) ? this.token0.decimals : this.token1.decimals))
      const decimalOut = JSBI.BigInt(10**(outputReserve.currency.equals(this.token0) ? this.token0.decimals : this.token1.decimals))
      const xy = this.getStableK(inputReserve.numerator, outputReserve.numerator, decimalIn, decimalOut)
      const tmpInputReserve = JSBI.divide(JSBI.multiply(inputReserve.numerator, _1e18), decimalIn)
      const tmpOutputReserve = JSBI.divide(JSBI.multiply(outputReserve.numerator, _1e18), decimalOut)
      inputAmountWithFee = JSBI.divide(JSBI.multiply(inputAmountWithFee, _1e18), decimalIn)
      let outputAmount = JSBI.subtract(tmpOutputReserve, this.getY(JSBI.add(inputAmountWithFee, tmpInputReserve), xy, tmpOutputReserve))
      outputAmount = JSBI.divide(JSBI.multiply(outputAmount, decimalOut), _1e18)
      const out = CurrencyAmount.fromRawAmount(
          inputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
          JSBI.divide(outputAmount, inputAmount.denominator),
      )
      return [out, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(out), this.stable)]
    }else {
      const inputAmountWithFee = JSBI.multiply(inputAmount.quotient, _997)
      const numerator = JSBI.multiply(inputAmountWithFee, outputReserve.quotient)
      const denominator = JSBI.add(JSBI.multiply(inputReserve.quotient, _1000), inputAmountWithFee)
      const outputAmount = CurrencyAmount.fromRawAmount(
          inputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
          JSBI.divide(numerator, denominator)
      )
      if (JSBI.equal(outputAmount.quotient, ZERO)) {
        throw new InsufficientInputAmountError()
      }
      return [outputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount), this.stable)]
    }
  }

  public getInputAmount(outputAmount: CurrencyAmount<Token>): [CurrencyAmount<Token>, Pair] {
    invariant(this.involvesToken(outputAmount.currency), 'TOKEN')
    if (
      JSBI.equal(this.reserve0.quotient, ZERO) ||
      JSBI.equal(this.reserve1.quotient, ZERO) ||
      JSBI.greaterThanOrEqual(outputAmount.quotient, this.reserveOf(outputAmount.currency).quotient)
    ) {
      throw new InsufficientReservesError()
    }

    const outputReserve = this.reserveOf(outputAmount.currency)
    const inputReserve = this.reserveOf(outputAmount.currency.equals(this.token0) ? this.token1 : this.token0)
    if (this.stable) {
      let outputAmountWithFee = JSBI.divide(JSBI.multiply(outputAmount.numerator, _9999), _10000)
      const decimalIn = JSBI.BigInt(10**(inputReserve.currency.equals(this.token0) ? this.token0.decimals : this.token1.decimals))
      const decimalOut = JSBI.BigInt(10**(outputReserve.currency.equals(this.token0) ? this.token0.decimals : this.token1.decimals))
      const xy = this.getStableK(inputReserve.numerator, outputReserve.numerator, decimalIn, decimalOut)
      const tmpInputReserve = JSBI.divide(JSBI.multiply(inputReserve.numerator, _1e18), decimalIn)
      const tmpOutputReserve = JSBI.divide(JSBI.multiply(outputReserve.numerator, _1e18), decimalOut)
      outputAmountWithFee = JSBI.divide(JSBI.multiply(outputAmountWithFee, _1e18), decimalOut)
      let inputAmount = JSBI.subtract(this.getY(JSBI.subtract(tmpOutputReserve, outputAmountWithFee), xy, tmpInputReserve), tmpInputReserve)
      inputAmount = JSBI.divide(JSBI.multiply(inputAmount, decimalIn), _1e18)
      const input = CurrencyAmount.fromRawAmount(
          outputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
          JSBI.divide(inputAmount, outputAmount.denominator),
      )
      return [
        input, new Pair(inputReserve.add(input), outputReserve.subtract(outputAmount), this.stable)
      ]
    }else {
      const numerator = JSBI.multiply(JSBI.multiply(inputReserve.quotient, outputAmount.quotient), _1000)
      const denominator = JSBI.multiply(JSBI.subtract(outputReserve.quotient, outputAmount.quotient), _997)
      const inputAmount = CurrencyAmount.fromRawAmount(
          outputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
          JSBI.add(JSBI.divide(numerator, denominator), ONE)
      )
      return [inputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount), this.stable)]
    }
  }

  public getLiquidityMinted(
    totalSupply: CurrencyAmount<Token>,
    tokenAmountA: CurrencyAmount<Token>,
    tokenAmountB: CurrencyAmount<Token>
  ): CurrencyAmount<Token> {
    invariant(totalSupply.currency.equals(this.liquidityToken), 'LIQUIDITY')
    const tokenAmounts = tokenAmountA.currency.sortsBefore(tokenAmountB.currency) // does safety checks
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
}
