/* eslint-disable @typescript-eslint/no-unused-vars */
import { BigintIsh } from '@ubeswap/sdk-core'

/**
 * Provides information about ticks
 */
export interface TickDataProvider {
  /**
   * Return information corresponding to a specific tick
   * @param tick the tick to load
   */
  getTick(tick: number): Promise<{ liquidityNet: BigintIsh }>

  /**
   * Return the next tick that is initialized within a single word
   * @param tick The current tick
   * @param lte Whether the next tick should be lte the current tick
   * @param tickSpacing The tick spacing of the pool
   */
  nextInitializedTickWithinOneWord(tick: number, lte: boolean, tickSpacing: number): Promise<[number, boolean]>
}

/**
 * This tick data provider does not know how to fetch any tick data. It throws whenever it is required. Useful if you
 * do not need to load tick data for your use case.
 */
export class NoTickDataProvider implements TickDataProvider {
  private static ERROR_MESSAGE = 'No tick data provider was given'
  async getTick(_tick: number): Promise<{ liquidityNet: BigintIsh }> {
    throw new Error(NoTickDataProvider.ERROR_MESSAGE)
  }

  async nextInitializedTickWithinOneWord(
    _tick: number,
    _lte: boolean,
    _tickSpacing: number
  ): Promise<[number, boolean]> {
    throw new Error(NoTickDataProvider.ERROR_MESSAGE)
  }
}
