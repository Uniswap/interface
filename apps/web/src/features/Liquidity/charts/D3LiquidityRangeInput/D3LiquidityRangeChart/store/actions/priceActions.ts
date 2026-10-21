import { getCandlestickPriceBounds } from '~/components/Charts/PriceChart/utils'
import { CHART_BEHAVIOR } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import { calculateRangeViewport } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/viewportUtils'
import type {
  ChartStoreState,
  TickNavigationParams,
  TickRangeChange,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { DefaultPriceStrategy } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import {
  calculateStrategyTicks,
  detectTickStrategy,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceStrategies'
import {
  navigateTick,
  snapTickToSpacing,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'
import { clampMaxTick } from '~/features/Liquidity/utils/clampTickRange'

/** The pan that keeps a range edge at the same screen position when the range moves from one min tick to another. */
function getPanFollowingRange({
  state: { renderingContext, panY },
  fromMinTick,
  toMinTick,
}: {
  state: Pick<ChartStoreState, 'renderingContext' | 'panY'>
  fromMinTick: number | undefined
  toMinTick: number
}): number {
  if (!renderingContext || fromMinTick === undefined) {
    return panY
  }
  const { tickToAxis } = renderingContext.tickScale
  return panY + tickToAxis(fromMinTick) - tickToAxis(toMinTick)
}

interface PriceActionCallbacks {
  onMinTickChange: (tick?: number) => void
  onMaxTickChange: (tick?: number) => void
  onMinMaxTickChange: (range: TickRangeChange) => void
}

// Every strategy except these is positioned relative to the current tick, so it has to be
// re-applied when that tick moves. Expressed as the complement so a new strategy re-anchors
// by default rather than silently opting out.
const CURRENT_TICK_INDEPENDENT_STRATEGIES: DefaultPriceStrategy[] = [
  DefaultPriceStrategy.FULL_RANGE,
  DefaultPriceStrategy.CUSTOM,
]

const isCurrentTickAnchored = (strategy: DefaultPriceStrategy): boolean =>
  !CURRENT_TICK_INDEPENDENT_STRATEGIES.includes(strategy)

// Where the price sits relative to the selected range: -1 below, 0 inside, 1 above. Undefined
// bounds (no concrete range yet) read as inside (0) so a preset with no ticks can't register a
// spurious boundary crossing. Tracking the side — not just in/out membership — is what lets a price
// that jumps clear across a one-sided range in a single move register as a crossing: both endpoints
// are "out of range", but below (-1) and above (+1) are different positions.
const tickRangePosition = ({
  tick,
  minTick,
  maxTick,
}: {
  tick: number
  minTick?: number
  maxTick?: number
}): -1 | 0 | 1 => {
  if (minTick === undefined || maxTick === undefined) {
    return 0
  }
  if (tick < minTick) {
    return -1
  }
  if (tick > maxTick) {
    return 1
  }
  return 0
}

export const createPriceActions = ({
  set,
  get,
  callbacks,
}: {
  set: (fn: (state: ChartStoreState) => ChartStoreState) => void
  get: () => ChartStoreState
  callbacks: PriceActionCallbacks
}) => ({
  // WARNING: This function will cause the CreateLiquidityContext to re-render.
  // Use this sparingly when a user action is complete (i.e drag ends).
  // This function should not react to min/max state changes.
  handleTickChange: ({ changeType, tick }: { changeType: 'min' | 'max'; tick?: number }) => {
    // Only the +/- buttons edit one edge, so this is a manual edit: the range stops following its
    // preset even if it steps back onto the preset's ticks.
    set((state) => ({ ...state, presetTicks: undefined }))
    if (changeType === 'min') {
      callbacks.onMinTickChange(tick)
    } else {
      callbacks.onMaxTickChange(tick)
    }

    const { maxTick, minTick, selectedPriceStrategy, tickSpacing, currentTick } = get()

    const detectedStrategy = detectTickStrategy({
      minTick,
      maxTick,
      currentTick,
      tickSpacing,
    })

    const currentSelectedStrategy = selectedPriceStrategy
    if (detectedStrategy !== currentSelectedStrategy) {
      set((state) => ({ ...state, selectedPriceStrategy: detectedStrategy }))
    }
  },

  /**
   * Push a whole range to the parent in one update.
   *
   * `handleTickChange` emits a single edge, and the parent clamps an incoming min against its
   * currently-held max (and vice versa) — see `clampMinTick`/`clampMaxTick`. Emitting a range as
   * two of those is lossy whenever the new range clears the old one: the first edge gets clamped
   * against a bound that the second edge is about to replace. Ranges therefore go out together.
   */
  handleTickRangeChange: ({ minTick, maxTick, presetStrategy }: TickRangeChange) => {
    const { actions, selectedPriceStrategy, tickSpacing, currentTick } = get()

    // The parent's per-edge clamps were what kept the bounds ordered; an atomic update bypasses
    // them, so this backstops the invariant for every emitter. It can only push max up, so an
    // emitter that knows which edge moved still has to keep its own bounds apart.
    const orderedMaxTick = clampMaxTick({ tick: maxTick, minTick, tickSpacing })

    actions.setChartState({
      minTick,
      maxTick: orderedMaxTick,
      presetTicks:
        presetStrategy && minTick !== undefined && orderedMaxTick !== undefined
          ? { minTick, maxTick: orderedMaxTick }
          : undefined,
    })
    callbacks.onMinMaxTickChange({ minTick, maxTick: orderedMaxTick, presetStrategy })

    const detectedStrategy = detectTickStrategy({ minTick, maxTick: orderedMaxTick, currentTick, tickSpacing })
    if (detectedStrategy !== selectedPriceStrategy) {
      set((state) => ({ ...state, selectedPriceStrategy: detectedStrategy }))
    }
  },

  setPriceStrategy: ({ priceStrategy, animate }: { priceStrategy: DefaultPriceStrategy; animate: boolean }) => {
    const {
      actions,
      renderingContext,
      tickSpacing,
      currentTick,
      minTick: defaultMinTick,
      maxTick: defaultMaxTick,
    } = get()

    set((state) => ({
      ...state,
      selectedPriceStrategy: priceStrategy,
      isFullRange: priceStrategy === DefaultPriceStrategy.FULL_RANGE,
    }))

    const { minTick: targetMinTick, maxTick: targetMaxTick } = calculateStrategyTicks({
      priceStrategy,
      currentTick,
      tickSpacing,
      defaultMinTick,
      defaultMaxTick,
    })
    const presetStrategy = isCurrentTickAnchored(priceStrategy) ? priceStrategy : undefined

    // Without a mounted chart (e.g. creating a new pool) there's no viewport to animate — set ticks directly
    if (!renderingContext) {
      actions.handleTickRangeChange({ minTick: targetMinTick, maxTick: targetMaxTick, presetStrategy })
      return
    }

    const { priceData, priceToY, yToTick } = renderingContext

    let viewportMinTick = targetMinTick
    let viewportMaxTick = targetMaxTick

    if (priceStrategy === DefaultPriceStrategy.FULL_RANGE && priceData.length > 0) {
      const { min: priceMin, max: priceMax } = getCandlestickPriceBounds(priceData)
      viewportMinTick = snapTickToSpacing(yToTick(priceToY({ price: priceMin })), tickSpacing)
      viewportMaxTick = snapTickToSpacing(yToTick(priceToY({ price: priceMax })), tickSpacing)
    }

    const { targetZoom, targetPanY } = calculateRangeViewport({
      minTick: viewportMinTick,
      maxTick: viewportMaxTick,
      tickSpacing,
    })

    if (animate) {
      actions.animateToState({
        targetZoom,
        targetPan: targetPanY,
        ticks:
          defaultMinTick !== undefined && defaultMaxTick !== undefined
            ? {
                startMinTick: defaultMinTick,
                startMaxTick: defaultMaxTick,
                targetMinTick,
                targetMaxTick,
                snapTicks: (minTick, maxTick) => ({
                  minTick: snapTickToSpacing(minTick, tickSpacing),
                  maxTick: snapTickToSpacing(maxTick, tickSpacing),
                }),
              }
            : undefined,
      })
    } else {
      actions.setChartState({
        zoomLevel: targetZoom,
        panY: targetPanY,
        minTick: targetMinTick,
        maxTick: targetMaxTick,
      })
    }

    setTimeout(() => {
      // oxlint-disable-next-line no-shadow
      const { renderingContext } = get()
      if (renderingContext) {
        actions.handleTickRangeChange({ minTick: targetMinTick, maxTick: targetMaxTick, presetStrategy })
      }
    }, CHART_BEHAVIOR.ANIMATION_DURATION)
  },

  incrementMax: ({ tickSpacing, baseCurrency, quoteCurrency, protocolVersion }: TickNavigationParams) => {
    const { maxTick, actions, renderingContext } = get()
    if (maxTick === undefined) {
      return
    }

    const result = navigateTick({
      currentTick: maxTick,
      direction: 'increment',
      tickSpacing,
      baseCurrency,
      quoteCurrency,
      protocolVersion,
      liquidityData: renderingContext?.liquidityData,
    })
    if (!result) {
      return
    }

    const newTick = result.tick

    actions.setChartState({ maxTick: newTick })
    actions.handleTickChange({ changeType: 'max', tick: newTick })
  },

  decrementMax: ({ tickSpacing, baseCurrency, quoteCurrency, protocolVersion }: TickNavigationParams) => {
    const { maxTick, actions, renderingContext } = get()
    if (maxTick === undefined) {
      return
    }

    const result = navigateTick({
      currentTick: maxTick,
      direction: 'decrement',
      tickSpacing,
      baseCurrency,
      quoteCurrency,
      protocolVersion,
      liquidityData: renderingContext?.liquidityData,
    })
    if (!result) {
      return
    }

    const newTick = result.tick

    actions.setChartState({ maxTick: newTick })
    actions.handleTickChange({ changeType: 'max', tick: newTick })
  },

  incrementMin: ({ tickSpacing, baseCurrency, quoteCurrency, protocolVersion }: TickNavigationParams) => {
    const { minTick, actions, renderingContext } = get()
    if (minTick === undefined) {
      return
    }

    const result = navigateTick({
      currentTick: minTick,
      direction: 'increment',
      tickSpacing,
      baseCurrency,
      quoteCurrency,
      protocolVersion,
      liquidityData: renderingContext?.liquidityData,
    })
    if (!result) {
      return
    }

    const newTick = result.tick

    actions.setChartState({ minTick: newTick })
    actions.handleTickChange({ changeType: 'min', tick: newTick })
  },

  decrementMin: ({ tickSpacing, baseCurrency, quoteCurrency, protocolVersion }: TickNavigationParams) => {
    const { minTick, actions, renderingContext } = get()
    if (minTick === undefined) {
      return
    }

    const result = navigateTick({
      currentTick: minTick,
      direction: 'decrement',
      tickSpacing,
      baseCurrency,
      quoteCurrency,
      protocolVersion,
      liquidityData: renderingContext?.liquidityData,
    })
    if (!result) {
      return
    }

    const newTick = result.tick

    actions.setChartState({ minTick: newTick })
    actions.handleTickChange({ changeType: 'min', tick: newTick })
  },

  syncCurrentTickFromParent: ({
    currentTick,
    currentPrice,
    tickSpacing,
    isInitialPriceDirty,
    isRangeLocked,
  }: {
    currentTick: number
    currentPrice?: number
    tickSpacing: number
    isInitialPriceDirty?: boolean
    isRangeLocked?: boolean
  }) => {
    const {
      actions,
      creatingPoolOrPair,
      currentTick: prevCurrentTick,
      currentPrice: prevCurrentPrice,
      tickSpacing: prevTickSpacing,
      isFullRange,
      minTick,
      maxTick,
      selectedPriceStrategy,
      presetTicks,
      isRangeLocked: wasRangeLocked = false,
    } = get()
    const rangeLocked = Boolean(isRangeLocked)
    // The parent's followed range catches up as soon as a lock lifts, so the store has to as well.
    const lockLifted = !creatingPoolOrPair && wasRangeLocked && !rangeLocked

    // Object.is, not ===: the parent passes Number(price?.toSignificant()), which is NaN while the
    // initial price is unset, and NaN === NaN is false.
    if (
      Object.is(currentTick, prevCurrentTick) &&
      Object.is(currentPrice, prevCurrentPrice) &&
      tickSpacing === prevTickSpacing &&
      rangeLocked === wasRangeLocked
    ) {
      return
    }

    set((state) => ({ ...state, currentTick, currentPrice, tickSpacing, isRangeLocked: rangeLocked }))

    // A sub-tick change alone (same tick and spacing) never re-anchors.
    if (!lockLifted && Object.is(currentTick, prevCurrentTick) && tickSpacing === prevTickSpacing) {
      return
    }

    // An existing pool's tick moves with its polled live price. A preset the user picked and left
    // untouched follows it — a tight range would otherwise strand out of range — while a range the
    // user typed or dragged (min/max no longer what the preset wrote) is never moved or relabeled.
    if (!creatingPoolOrPair) {
      const presetUntouched =
        presetTicks !== undefined && presetTicks.minTick === minTick && presetTicks.maxTick === maxTick
      if (
        rangeLocked ||
        isFullRange ||
        !presetUntouched ||
        !selectedPriceStrategy ||
        !isCurrentTickAnchored(selectedPriceStrategy)
      ) {
        return
      }

      const { minTick: targetMinTick, maxTick: targetMaxTick } = calculateStrategyTicks({
        priceStrategy: selectedPriceStrategy,
        currentTick,
        tickSpacing,
      })
      if (targetMinTick === minTick && targetMaxTick === maxTick) {
        return
      }

      // Pan the view by the same tick delta in the same update, so the band, its handles and the price
      // marker hold their place on screen and the price history and liquidity shift under them —
      // instead of the band jumping and, poll by poll, walking out of view. (A glide would need
      // fractional ticks mid-animation, which the tick-to-price math rejects.)
      actions.setChartState({
        minTick: targetMinTick,
        maxTick: targetMaxTick,
        panY: getPanFollowingRange({ state: get(), fromMinTick: minTick, toMinTick: targetMinTick }),
      })

      actions.handleTickRangeChange({
        minTick: targetMinTick,
        maxTick: targetMaxTick,
        presetStrategy: selectedPriceStrategy,
      })
      // handleTickRangeChange re-detects with tolerance; the user's pick stays the selected preset.
      set((state) => ({ ...state, selectedPriceStrategy }))
      return
    }

    // Full range owns the bounds, so don't write concrete ticks underneath it — the same reason the
    // provider's min/max sync and the parent's handleChartRangeInput both bail on it. A strategy
    // selected before full range was toggled on is still held here, because the create flow's
    // `reset` returns early with no rendering context and never clears it.
    if (isFullRange) {
      return
    }

    // Past the guard above this is always the create flow. The tick moved either because the user
    // *edited* the initial price (isInitialPriceDirty) or because the streamed reference re-seeded on
    // its own while the field is untouched. Only the deliberate edit should recenter a preset —
    // re-anchoring on the self-moving re-seed would make the range twitch every few seconds (LP-1673).
    const userEditedInitialPrice = Boolean(isInitialPriceDirty)

    if (selectedPriceStrategy && isCurrentTickAnchored(selectedPriceStrategy)) {
      // Re-anchor the preset when the user edited the price (recenter on it, even with no boundary
      // crossing), when the streamed re-seed crosses the in-/out-of-range boundary it was chosen for,
      // or when the fee tier's spacing changes. Otherwise hold the range still while the re-seed
      // drifts within it.
      const spacingChanged = tickSpacing !== prevTickSpacing
      const changedSide =
        tickRangePosition({ tick: prevCurrentTick, minTick, maxTick }) !==
        tickRangePosition({ tick: currentTick, minTick, maxTick })

      if (userEditedInitialPrice || spacingChanged || changedSide) {
        const { minTick: targetMinTick, maxTick: targetMaxTick } = calculateStrategyTicks({
          priceStrategy: selectedPriceStrategy,
          currentTick,
          tickSpacing,
        })
        actions.handleTickRangeChange({ minTick: targetMinTick, maxTick: targetMaxTick })
      }
    } else if (userEditedInitialPrice) {
      // Re-detect the preset only on a user edit. A self-moving re-seed must not relabel a manually
      // entered range as a preset (detectTickStrategy only ever returns a preset or undefined, never
      // CUSTOM) — a later boundary crossing would then re-anchor over the user's typed bounds.
      const detectedStrategy = detectTickStrategy({ minTick, maxTick, currentTick, tickSpacing })
      if (detectedStrategy !== selectedPriceStrategy) {
        set((state) => ({ ...state, selectedPriceStrategy: detectedStrategy }))
      }
    }
  },

  syncIsFullRangeFromParent: (isFullRange: boolean) => {
    const { actions, isFullRange: currentIsFullRange } = get()
    if (currentIsFullRange === isFullRange) {
      return
    }

    set((state) => ({ ...state, isFullRange }))
    actions.reset({ animate: false })
  },
})
