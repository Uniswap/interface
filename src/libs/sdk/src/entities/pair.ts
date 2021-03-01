import { TokenAmount, Price } from './fractions'
import invariant from 'tiny-invariant'
import JSBI from 'jsbi'

import { BigintIsh, MINIMUM_LIQUIDITY, ZERO, ONE, FIVE, ChainId, PRECISION } from '../constants'
import { sqrt, parseBigintIsh } from '../utils'
import { InsufficientReservesError, InsufficientInputAmountError } from '../errors'
import { Token } from './token'
export class Pair {
  public readonly liquidityToken: Token
  private readonly tokenAmounts: [TokenAmount, TokenAmount]
  private readonly virtualTokenAmounts: [TokenAmount, TokenAmount]
  public readonly fee: JSBI
  public readonly address: string

  public constructor(
    address: string,
    tokenAmountA: TokenAmount,
    tokenAmountB: TokenAmount,
    virtualTokenAmountA: TokenAmount,
    virtualTokenAmountB: TokenAmount,
    fee: JSBI
  ) {
    this.address = address
    const tokenAmounts = tokenAmountA.token.sortsBefore(tokenAmountB.token) // does safety checks
      ? [tokenAmountA, tokenAmountB]
      : [tokenAmountB, tokenAmountA]
    const virtualTokenAmounts = tokenAmountA.token.sortsBefore(tokenAmountB.token) // does safety checks
      ? [virtualTokenAmountA, virtualTokenAmountB]
      : [virtualTokenAmountB, virtualTokenAmountA]

    this.liquidityToken = new Token(tokenAmounts[0].token.chainId, address, 18, 'XYZ-LP', 'XYZSwap LP')
    this.tokenAmounts = tokenAmounts as [TokenAmount, TokenAmount]
    this.virtualTokenAmounts = virtualTokenAmounts as [TokenAmount, TokenAmount]
    this.fee = fee
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
  public get token0Price(): Price {
    return new Price(this.token0, this.token1, this.virtualTokenAmounts[0].raw, this.virtualTokenAmounts[1].raw)
  }

  /**
   * Returns the current mid price of the pair in terms of token1, i.e. the ratio of reserve0 to reserve1
   */
  public get token1Price(): Price {
    return new Price(this.token1, this.token0, this.virtualTokenAmounts[1].raw, this.virtualTokenAmounts[0].raw)
  }

  /**
   * Return the price of the given token in terms of the other token in the pair.
   * @param token token to return price of
   */
  public priceOf(token: Token): Price {
    invariant(this.involvesToken(token), 'TOKEN')
    return token.equals(this.token0) ? this.token0Price : this.token1Price
  }

  /**
   * Returns the chain ID of the tokens in the pair.
   */
  public get chainId(): ChainId {
    return this.token0.chainId
  }

  public get token0(): Token {
    return this.tokenAmounts[0].token
  }

  public get token1(): Token {
    return this.tokenAmounts[1].token
  }

  public get reserve0(): TokenAmount {
    return this.tokenAmounts[0]
  }

  public get reserve1(): TokenAmount {
    return this.tokenAmounts[1]
  }

  public get virtualReserve0(): TokenAmount {
    return this.virtualTokenAmounts[0]
  }

  public get virtualReserve1(): TokenAmount {
    return this.virtualTokenAmounts[1]
  }

  public reserveOf(token: Token): TokenAmount {
    invariant(this.involvesToken(token), 'TOKEN')
    return token.equals(this.token0) ? this.reserve0 : this.reserve1
  }

  public virtualReserveOf(token: Token): TokenAmount {
    invariant(this.involvesToken(token), 'TOKEN')
    return token.equals(this.token0) ? this.virtualReserve0 : this.virtualReserve1
  }

  public getOutputAmount(inputAmount: TokenAmount): [TokenAmount, TokenAmount[]] {
    invariant(this.involvesToken(inputAmount.token), 'TOKEN')
    if (JSBI.equal(this.reserve0.raw, ZERO) || JSBI.equal(this.reserve1.raw, ZERO)) {
      throw new InsufficientReservesError()
    }

    const outputToken = inputAmount.token.equals(this.token0) ? this.token1 : this.token0
    const inputReserve = this.virtualReserveOf(inputAmount.token)
    const outputReserve = this.virtualReserveOf(outputToken)

    const inputAmountWithFee = JSBI.divide(
      JSBI.multiply(inputAmount.raw, JSBI.subtract(PRECISION, this.fee)),
      PRECISION
    )
    const numerator = JSBI.multiply(inputAmountWithFee, outputReserve.raw)
    const denominator = JSBI.add(inputReserve.raw, inputAmountWithFee)
    const outputAmount = new TokenAmount(outputToken, JSBI.divide(numerator, denominator))

    if (JSBI.greaterThan(outputAmount.raw, this.reserveOf(outputToken).raw)) {
      throw new InsufficientReservesError()
    }

    if (JSBI.equal(outputAmount.raw, ZERO)) {
      throw new InsufficientInputAmountError()
    }
    return [outputAmount, [inputReserve.add(inputAmount), outputReserve.subtract(outputAmount)]]
  }

  public getInputAmount(outputAmount: TokenAmount): [TokenAmount, TokenAmount[]] {
    invariant(this.involvesToken(outputAmount.token), 'TOKEN')
    if (
      JSBI.equal(this.reserve0.raw, ZERO) ||
      JSBI.equal(this.reserve1.raw, ZERO) ||
      JSBI.greaterThanOrEqual(outputAmount.raw, this.reserveOf(outputAmount.token).raw) ||
      JSBI.greaterThan(outputAmount.raw, this.virtualReserveOf(outputAmount.token).raw)
    ) {
      throw new InsufficientReservesError()
    }

    const inputToken = outputAmount.token.equals(this.token0) ? this.token1 : this.token0

    const outputReserve = this.virtualReserveOf(outputAmount.token)
    const inputReserve = this.virtualReserveOf(inputToken)
    ///
    let numerator = JSBI.multiply(inputReserve.raw, outputAmount.raw)
    let denominator = JSBI.subtract(outputReserve.raw, outputAmount.raw)
    const inputAmountWithFee = JSBI.add(JSBI.divide(numerator, denominator), ONE)

    numerator = JSBI.multiply(inputAmountWithFee, PRECISION)
    denominator = JSBI.subtract(PRECISION, this.fee)

    const inputAmount = new TokenAmount(
      inputToken,
      JSBI.divide(JSBI.subtract(JSBI.add(numerator, denominator), ONE), denominator)
    )
    return [inputAmount, [inputReserve.add(inputAmount), outputReserve.subtract(outputAmount)]]
  }

  public getLiquidityMinted(
    totalSupply: TokenAmount,
    tokenAmountA: TokenAmount,
    tokenAmountB: TokenAmount
  ): TokenAmount {
    invariant(totalSupply.token.equals(this.liquidityToken), 'LIQUIDITY')
    const tokenAmounts = tokenAmountA.token.sortsBefore(tokenAmountB.token) // does safety checks
      ? [tokenAmountA, tokenAmountB]
      : [tokenAmountB, tokenAmountA]
    invariant(tokenAmounts[0].token.equals(this.token0) && tokenAmounts[1].token.equals(this.token1), 'TOKEN')

    let liquidity: JSBI
    if (JSBI.equal(totalSupply.raw, ZERO)) {
      liquidity = JSBI.subtract(sqrt(JSBI.multiply(tokenAmounts[0].raw, tokenAmounts[1].raw)), MINIMUM_LIQUIDITY)
    } else {
      const amount0 = JSBI.divide(JSBI.multiply(tokenAmounts[0].raw, totalSupply.raw), this.reserve0.raw)
      const amount1 = JSBI.divide(JSBI.multiply(tokenAmounts[1].raw, totalSupply.raw), this.reserve1.raw)
      liquidity = JSBI.lessThanOrEqual(amount0, amount1) ? amount0 : amount1
    }
    if (!JSBI.greaterThan(liquidity, ZERO)) {
      throw new InsufficientInputAmountError()
    }
    return new TokenAmount(this.liquidityToken, liquidity)
  }

  public getLiquidityValue(
    token: Token,
    totalSupply: TokenAmount,
    liquidity: TokenAmount,
    feeOn: boolean = false,
    kLast?: BigintIsh
  ): TokenAmount {
    invariant(this.involvesToken(token), 'TOKEN')
    invariant(totalSupply.token.equals(this.liquidityToken), 'TOTAL_SUPPLY')
    invariant(liquidity.token.equals(this.liquidityToken), 'LIQUIDITY')
    invariant(JSBI.lessThanOrEqual(liquidity.raw, totalSupply.raw), 'LIQUIDITY')

    let totalSupplyAdjusted: TokenAmount
    if (!feeOn) {
      totalSupplyAdjusted = totalSupply
    } else {
      invariant(!!kLast, 'K_LAST')
      const kLastParsed = parseBigintIsh(kLast)
      if (!JSBI.equal(kLastParsed, ZERO)) {
        const rootK = sqrt(JSBI.multiply(this.virtualReserve0.raw, this.virtualReserve1.raw))
        const rootKLast = sqrt(kLastParsed)
        if (JSBI.greaterThan(rootK, rootKLast)) {
          const numerator = JSBI.multiply(totalSupply.raw, JSBI.subtract(rootK, rootKLast))
          const denominator = JSBI.add(JSBI.multiply(rootK, FIVE), rootKLast)
          const feeLiquidity = JSBI.divide(numerator, denominator)
          totalSupplyAdjusted = totalSupply.add(new TokenAmount(this.liquidityToken, feeLiquidity))
        } else {
          totalSupplyAdjusted = totalSupply
        }
      } else {
        totalSupplyAdjusted = totalSupply
      }
    }

    return new TokenAmount(
      token,
      JSBI.divide(JSBI.multiply(liquidity.raw, this.reserveOf(token).raw), totalSupplyAdjusted.raw)
    )
  }
}
