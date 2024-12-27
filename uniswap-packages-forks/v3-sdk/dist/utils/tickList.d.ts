import { Tick } from '../entities/tick';
/**
 * Utility methods for interacting with sorted lists of ticks
 */
export declare abstract class TickList {
    /**
     * Cannot be constructed
     */
    private constructor();
    static validateList(ticks: Tick[], tickSpacing: number): void;
    static isBelowSmallest(ticks: readonly Tick[], tick: number): boolean;
    static isAtOrAboveLargest(ticks: readonly Tick[], tick: number): boolean;
    static getTick(ticks: readonly Tick[], index: number): Tick;
    /**
     * Finds the largest tick in the list of ticks that is less than or equal to tick
     * @param ticks list of ticks
     * @param tick tick to find the largest tick that is less than or equal to tick
     * @private
     */
    private static binarySearch;
    static nextInitializedTick(ticks: readonly Tick[], tick: number, lte: boolean): Tick;
    static nextInitializedTickWithinOneWord(ticks: readonly Tick[], tick: number, lte: boolean, tickSpacing: number): [number, boolean];
}
