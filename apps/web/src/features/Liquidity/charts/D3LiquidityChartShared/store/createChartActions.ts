import { CHART_BEHAVIOR } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import { boundPan } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/boundPan'

/**
 * Minimal state interface that shared actions need to read/write.
 * Both horizontal and vertical stores satisfy this.
 */
export interface ChartCoreState {
  zoomLevel: number
  dimensions: { width: number; height: number }
  renderingContext: { tickSpacing: number } | null
}

interface CreateChartActionsParams<S extends ChartCoreState> {
  set: (fn: (state: S) => S) => void
  get: () => S & { actions: ChartCoreActions }
  /** Returns the pan value from current state (panX or panY) */
  getPan: (state: S) => number
  /** Returns the viewport size for the zoom/pan axis */
  getViewportSize: (state: S) => number
  /** Returns the content size for boundPan (viewport for horizontal, CHART_HEIGHT for vertical) */
  getContentSize: (state: S) => number
  /** Builds the state update for a new pan value */
  setPan: (state: S, pan: number) => S
  /** Calculate max zoom for this chart orientation */
  calculateMaxZoom: (tickSpacing: number, viewportSize: number) => number
}

export interface TickAnimation {
  startMinTick: number
  startMaxTick: number
  targetMinTick: number
  targetMaxTick: number
  /** Snap ticks to spacing each animation frame */
  snapTicks?: (minTick: number, maxTick: number) => { minTick: number; maxTick: number }
}

export interface AnimateParams {
  targetZoom: number
  targetPan: number
  ticks?: TickAnimation
  duration?: number
}

export interface ChartCoreActions {
  zoom: (targetZoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  animateToState: (params: AnimateParams) => void
}

/**
 * Creates shared zoom/pan/animate actions used by both horizontal and vertical charts.
 *
 * The caller provides axis-specific accessors (getPan, getViewportSize, etc.)
 * so these actions work on either axis without knowing which one.
 */
export function createChartActions<S extends ChartCoreState>({
  set,
  get,
  getPan,
  getViewportSize,
  getContentSize,
  setPan,
  calculateMaxZoom,
}: CreateChartActionsParams<S>): ChartCoreActions {
  let animationFrameId: number | undefined

  return {
    zoom: (targetZoom: number) => {
      const state = get()
      const currentZoom = state.zoomLevel
      const currentPan = getPan(state)
      const viewportSize = getViewportSize(state)
      const contentSize = getContentSize(state)
      const center = viewportSize / 2

      const zoomRatio = targetZoom / currentZoom
      const newPan = center - (center - currentPan) * zoomRatio

      const targetPan = boundPan({
        pan: newPan,
        viewportSize,
        contentSize,
        zoomLevel: targetZoom,
      })

      state.actions.animateToState({ targetZoom, targetPan })
    },

    zoomIn: () => {
      const state = get()
      if (!state.renderingContext) {
        return
      }
      const viewportSize = getViewportSize(state)
      const maxZoom = calculateMaxZoom(state.renderingContext.tickSpacing, viewportSize)
      state.actions.zoom(Math.min(state.zoomLevel * CHART_BEHAVIOR.ZOOM_FACTOR, maxZoom))
    },

    zoomOut: () => {
      const state = get()
      state.actions.zoom(Math.max(state.zoomLevel / CHART_BEHAVIOR.ZOOM_FACTOR, CHART_BEHAVIOR.ZOOM_MIN))
    },

    animateToState: ({ targetZoom, targetPan, ticks, duration = CHART_BEHAVIOR.ANIMATION_DURATION }: AnimateParams) => {
      const state = get()
      if (!state.renderingContext) {
        return
      }

      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = undefined
      }

      const startZoom = state.zoomLevel
      const startPan = getPan(state)
      const startTime = Date.now()

      const animate = (): void => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeProgress = 1 - Math.pow(1 - progress, 4)

        const currentZoom = startZoom + (targetZoom - startZoom) * easeProgress
        const currentPan = startPan + (targetPan - startPan) * easeProgress

        let tickUpdate: { minTick: number; maxTick: number } | undefined
        if (ticks) {
          let minTick = ticks.startMinTick + (ticks.targetMinTick - ticks.startMinTick) * easeProgress
          let maxTick = ticks.startMaxTick + (ticks.targetMaxTick - ticks.startMaxTick) * easeProgress
          if (ticks.snapTicks) {
            ;({ minTick, maxTick } = ticks.snapTicks(minTick, maxTick))
          }
          tickUpdate = { minTick, maxTick }
        }

        set((s) => ({
          ...setPan(s, currentPan),
          ...tickUpdate,
          zoomLevel: currentZoom,
        }))

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate)
        } else {
          animationFrameId = undefined
        }
      }
      animate()
    },
  }
}
