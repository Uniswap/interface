import * as d3 from 'd3'
import { PriceRangeDragTarget } from 'uniswap/src/features/telemetry/types'
import { createLiquidityBarsOverlayRenderer } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/LiquidityBarsOverlayRenderer'
import {
  createParent,
  createRenderingContext,
  createStore,
  TICK_SPACING,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/test-utils/chartStoreHarness'

const CURRENT_TICK = 0
const INITIAL = { minTick: -3 * TICK_SPACING, maxTick: -TICK_SPACING }

function renderOverlay() {
  const onRangeDragEnd = vi.fn<(target: PriceRangeDragTarget) => void>()
  const parent = createParent(INITIAL)
  const store = createStore({
    currentTick: CURRENT_TICK,
    ...INITIAL,
    creatingPoolOrPair: false,
    parent,
    onRangeDragEnd,
  })
  const context = createRenderingContext({ currentTick: CURRENT_TICK })
  store.setState({ renderingContext: context })

  // A <g> outside an <svg> makes d3.pointer fall back to client coordinates, since jsdom has no SVG
  // geometry; the harness maps y straight to -tick, so clientY picks the tick.
  const g = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'g'))
  createLiquidityBarsOverlayRenderer({
    g,
    context,
    getState: store.getState,
    getActions: () => store.getState().actions,
  }).draw()

  const overlay = g.select<SVGRectElement>('rect.liquidity-overlay').node()
  if (!overlay) {
    throw new Error('overlay not rendered')
  }

  // d3-drag listens for mousedown on the element, then for move/up on the event's view. Vitest's
  // jsdom rejects its own window as a MouseEvent `view` init, so the view is attached afterwards.
  const mouseEvent = (type: string, clientY: number) => {
    const event = new MouseEvent(type, { bubbles: true, clientY })
    Object.defineProperty(event, 'view', { value: window })
    return event
  }
  const drag = (fromY: number, toY: number) => {
    overlay.dispatchEvent(mouseEvent('mousedown', fromY))
    window.dispatchEvent(mouseEvent('mousemove', toY))
    window.dispatchEvent(mouseEvent('mouseup', toY))
  }

  return { drag, onRangeDragEnd, store }
}

describe('LiquidityBarsOverlayRenderer drag-end reporting', () => {
  it('reports a range swept over the liquidity bars', () => {
    const { drag, onRangeDragEnd, store } = renderOverlay()

    drag(300, 420)

    expect(store.getState()).toMatchObject({ minTick: -7 * TICK_SPACING, maxTick: -5 * TICK_SPACING })
    expect(onRangeDragEnd).toHaveBeenCalledExactlyOnceWith(PriceRangeDragTarget.LiquidityArea)
  })

  it('compares against the range held when the sweep started', () => {
    const { drag, onRangeDragEnd, store } = renderOverlay()

    // Sweeping exactly over the current range only reads as a no-op if 'start' captured that range.
    drag(-INITIAL.maxTick, -INITIAL.minTick)

    expect(store.getState()).toMatchObject(INITIAL)
    expect(onRangeDragEnd).not.toHaveBeenCalled()
  })
})
