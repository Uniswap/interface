import { BigintIsh } from '@uniswap/sdk-core';
/**
 * Provides information about ticks
 */
export interface TickDataProvider {
    /**
     * Return information corresponding to a specific tick
     * @param tick the tick to load
     */
    getTick(tick: number): Promise<{
        liquidityNet: BigintIsh;
    }>;
    /**
     * Return the next tick that is initialized within a single word
     * @param tick the current tick
     * @param lte whether the next tick should be lte the current tick
     * @param tickSpacing the tick spacing of the pool
     */
    nextInitializedTickWithinOneWord(tick: number, lte: boolean, tickSpacing: number): Promise<[number, boolean]>;
}
/**
 * This tick data provider does not know how to fetch any tick data. It throws whenever it is required. Useful if you
 * do not need to load tick data for your use case.
 */
export declare class NoTickDataProvider implements TickDataProvider {
    private static ERROR_MESSAGE;
    getTick(_tick: number): Promise<{
        liquidityNet: BigintIsh;
    }>;
    nextInitializedTickWithinOneWord(_tick: number, _lte: boolean, _tickSpacing: number): Promise<[number, boolean]>;
}
