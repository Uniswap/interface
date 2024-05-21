import invariant from 'tiny-invariant'

import { Currency, Price, Token } from '@ubeswap/sdk-core'
import { Pool } from './pool'

/**
 * Represents a list of pools through which a swap can occur
 * @template TInput The input token
 * @template TOutput The output token
 */
export class Route<TInput extends Currency, TOutput extends Currency> {
  public readonly pools: Pool[]
  public readonly tokenPath: Token[]
  public readonly input: TInput
  public readonly output: TOutput

  private _midPrice: Price<TInput, TOutput> | null = null

  /**
   * Creates an instance of route.
   * @param pools An array of `Pool` objects, ordered by the route the swap will take
   * @param input The input token
   * @param output The output token
   */
  public constructor(pools: Pool[], input: TInput, output: TOutput) {
    invariant(pools.length > 0, 'POOLS')

    const chainId = pools[0]!.chainId
    const allOnSameChain = pools.every((pool) => pool.chainId === chainId)
    invariant(allOnSameChain, 'CHAIN_IDS')

    const wrappedInput = input.wrapped
    invariant(pools[0]!.involvesToken(wrappedInput), 'INPUT')

    invariant(pools[pools.length - 1]!.involvesToken(output.wrapped), 'OUTPUT')

    /**
     * Normalizes token0-token1 order and selects the next token/fee step to add to the path
     * */
    const tokenPath: Token[] = [wrappedInput]
    for (const [i, pool] of pools.entries()) {
      const currentInputToken = tokenPath[i] as Token
      invariant(currentInputToken.equals(pool.token0) || currentInputToken.equals(pool.token1), 'PATH')
      const nextToken = currentInputToken.equals(pool.token0) ? pool.token1 : pool.token0
      tokenPath.push(nextToken)
    }

    this.pools = pools
    this.tokenPath = tokenPath
    this.input = input
    this.output = output ?? tokenPath[tokenPath.length - 1]
  }

  public get chainId(): number {
    return this.pools[0]!.chainId
  }

  /**
   * Returns the mid price of the route
   */
  public get midPrice(): Price<TInput, TOutput> {
    if (this._midPrice !== null) return this._midPrice

    const price = this.pools.slice(1).reduce(
      ({ nextInput, price }, pool) => {
        return nextInput.equals(pool.token0)
          ? {
              nextInput: pool.token1,
              price: price.multiply(pool.token0Price),
            }
          : {
              nextInput: pool.token0,
              price: price.multiply(pool.token1Price),
            }
      },
      this.pools[0]!.token0.equals(this.input.wrapped)
        ? {
            nextInput: this.pools[0]!.token1,
            price: this.pools[0]!.token0Price,
          }
        : {
            nextInput: this.pools[0]!.token0,
            price: this.pools[0]!.token1Price,
          }
    ).price

    return (this._midPrice = new Price(this.input, this.output, price.denominator, price.numerator))
  }
}
