import JSBI from 'jsbi'
import { TickProcessed } from 'utils/computeSurroundingTicks'

/**
 * Computes the active liquidity at each tick boundary by anchoring cumulative liquidityNet
 * to the pool's actual liquidity at the current tick.
 *
 * This three-step process corrects the unanchored cumulative sums from computeSurroundingTicks
 * to produce accurate liquidity values for chart bar heights and tooltip token amounts:
 *
 * 1. Build cumulative sum of liquidityNet across all ticks (relative changes only)
 * 2. Calculate offset by comparing cumulative sum at active tick to actual pool.liquidity
 * 3. Apply offset to all ticks to get anchored active liquidity values
 *
 * Example with concrete values:
 * - Suppose activeTick = 100, pool.liquidity = 50000
 * - Raw cumulative sum at tick 100: rawCumLByTick[100] = 30000
 * - Offset = 50000 - 30000 = 20000
 * - Anchored liquidity at tick 100: 30000 + 20000 = 50000 ✓
 * - This ensures the chart's bar heights match actual pool state
 *
 * @param ticksProcessed - Array of processed ticks from computeSurroundingTicks
 * @param activeTick - The current active tick of the pool
 * @param liquidity - The current pool liquidity (JSBI)
 * @returns Map of tick index to anchored active liquidity (JSBI)
 */
export function calculateAnchoredLiquidityByTick({
  ticksProcessed,
  activeTick,
  liquidity,
}: {
  ticksProcessed: TickProcessed[]
  activeTick: number
  liquidity: JSBI
}): Map<number, JSBI> {
  // Step 1: Calculate cumulative sum of liquidityNet across fetched ticks (raw, unanchored)
  // This gives us the relative liquidity changes but not anchored to actual pool state
  // i.e tick: liquidityNet { 100: 1000, 101: 2000, 102: 3000 }
  // cumulative sum: { 100: 1000, 101: 3000, 102: 6000 }
  let runningL = JSBI.BigInt(0)
  const rawCumLByTick = new Map<number, JSBI>()
  for (const t of ticksProcessed) {
    const idx = t.tick
    const net = t.liquidityNet
    runningL = JSBI.add(runningL, net)
    rawCumLByTick.set(idx, runningL)
  }

  // Step 2: Anchor to pool.liquidity at the active tick boundary using an offset
  // The offset corrects the raw cumulative sum to match the actual pool liquidity
  // i.e. if activeTick = 100:
  //   cumulative sum at tick 100: 1000
  //   pool.liquidity: 5000
  //   offset: 5000 - 1000 = 4000
  const rawAtActive = rawCumLByTick.get(activeTick) || 0
  const offset = JSBI.subtract(liquidity, JSBI.BigInt(rawAtActive))

  // Step 3: Apply offset to calculate anchored active liquidity per tick boundary
  // These anchored values are used for both bar heights and tooltip token amounts
  // i.e. cumulative sum: { 100: 1000, 101: 3000, 102: 6000 }
  //      offset: 4000
  //      anchored liquidity: { 100: 5000, 101: 7000, 102: 10000 }
  const activeLiquidityByTick = new Map<number, JSBI>()
  for (const [idx, rawL] of rawCumLByTick.entries()) {
    activeLiquidityByTick.set(idx, JSBI.add(offset, JSBI.BigInt(rawL)))
  }

  return activeLiquidityByTick
}
