import { PriceRangeDragTarget } from 'uniswap/src/features/telemetry/types'
import {
  createParent,
  createRenderingContext,
  createStore,
  TICK_SPACING,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/test-utils/chartStoreHarness'

const CURRENT_TICK = 0
// A two-spacing range, so the whole-range drag's half-range lands on a spacing boundary.
const INITIAL = { minTick: -3 * TICK_SPACING, maxTick: -TICK_SPACING }

function createDragStore(onRangeDragEnd?: (target: PriceRangeDragTarget) => void) {
  const parent = createParent(INITIAL)
  const store = createStore({
    currentTick: CURRENT_TICK,
    ...INITIAL,
    creatingPoolOrPair: false,
    parent,
    onRangeDragEnd,
  })
  store.setState({ renderingContext: createRenderingContext({ currentTick: CURRENT_TICK }) })
  return { parent, store }
}

// d3's dispatch exposes its listener when `on` is called with just the type, which is how these
// tests drive a drag end without a DOM event source.
function dragListener(behavior: { on: (type: string) => unknown }, type: 'start' | 'end') {
  return behavior.on(type) as (event: { y: number }) => void
}

describe('createTickBasedDragBehavior', () => {
  it('emits a dragged range that clears the previous one without the parent clamping it', () => {
    const { parent, store } = createDragStore()
    const behavior = store.getState().actions.createTickBasedDragBehavior()

    // Grab the range by its centre, then drag it above the tick it used to sit under.
    dragListener(behavior, 'start')({ y: 1.5 * TICK_SPACING })
    dragListener(behavior, 'end')({ y: -100 })

    const { minTick, maxTick } = store.getState()
    expect({ minTick, maxTick }).toEqual({ minTick: -TICK_SPACING, maxTick: TICK_SPACING })
    // Emitted edge-by-edge, min arrived as the old max minus one spacing (-120) instead of -60.
    expect(parent.state).toEqual({ minTick, maxTick })
  })
})

describe('createHandleDragBehavior', () => {
  it('emits both edges when a handle is dragged past the other one', () => {
    const { parent, store } = createDragStore()
    const behavior = store.getState().actions.createHandleDragBehavior('min')

    // Dragging min above max swaps them, so both edges move even though one handle was grabbed.
    dragListener(behavior, 'start')({ y: 0 })
    dragListener(behavior, 'end')({ y: -10 })

    const { minTick, maxTick } = store.getState()
    expect({ minTick, maxTick }).toEqual({ minTick: INITIAL.maxTick, maxTick: 0 })
    expect(parent.state).toEqual({ minTick, maxTick })
  })

  it('keeps the bounds a spacing apart when a handle is dragged up against the other', () => {
    const { parent, store } = createDragStore()
    const behavior = store.getState().actions.createHandleDragBehavior('min')

    // Stop just short of the max handle. RANGE_INDICATOR_MIN_HEIGHT is a PIXEL floor, so it does
    // not guarantee a tick of separation — snapping can land min exactly on max.
    dragListener(behavior, 'start')({ y: 0 })
    dragListener(behavior, 'end')({ y: 70 })

    // The dragged edge steps away, so the handle the user did not touch stays put — the same
    // outcome the parent's per-edge clamp used to produce.
    expect(store.getState()).toMatchObject({ minTick: -2 * TICK_SPACING, maxTick: INITIAL.maxTick })
    expect(parent.state).toEqual({ minTick: -2 * TICK_SPACING, maxTick: INITIAL.maxTick })
  })
})

describe('drag-end reporting', () => {
  it('reports the grabbed handle once a handle drag moves the range', () => {
    const onRangeDragEnd = vi.fn()
    const { store } = createDragStore(onRangeDragEnd)
    const behavior = store.getState().actions.createHandleDragBehavior('min')

    // Pull min down from its rendered Y (180) to widen the range.
    dragListener(behavior, 'start')({ y: 180 })
    dragListener(behavior, 'end')({ y: 300 })

    expect(store.getState()).toMatchObject({ minTick: -300, maxTick: INITIAL.maxTick })
    expect(onRangeDragEnd).toHaveBeenCalledTimes(1)
    expect(onRangeDragEnd).toHaveBeenCalledWith(PriceRangeDragTarget.MinHandle)
  })

  it('reports the whole range when it is dragged by its body', () => {
    const onRangeDragEnd = vi.fn()
    const { store } = createDragStore(onRangeDragEnd)
    const behavior = store.getState().actions.createTickBasedDragBehavior()

    dragListener(behavior, 'start')({ y: 1.5 * TICK_SPACING })
    dragListener(behavior, 'end')({ y: -100 })

    expect(onRangeDragEnd).toHaveBeenCalledTimes(1)
    expect(onRangeDragEnd).toHaveBeenCalledWith(PriceRangeDragTarget.Range)
  })

  it('does not report a press that ends where the range started', () => {
    const onRangeDragEnd = vi.fn()
    const { parent, store } = createDragStore(onRangeDragEnd)
    const behavior = store.getState().actions.createHandleDragBehavior('min')

    // Release the min handle on the Y it is already rendered at: d3 still fires 'end'.
    dragListener(behavior, 'start')({ y: 180 })
    dragListener(behavior, 'end')({ y: 180 })

    expect(parent.state).toEqual(INITIAL)
    expect(onRangeDragEnd).not.toHaveBeenCalled()
  })

  it('reports a drag whose committed range differs from where it started on either edge', () => {
    const onRangeDragEnd = vi.fn()
    const { store } = createDragStore(onRangeDragEnd)
    const { handleRangeDragEnd } = store.getState().actions

    handleRangeDragEnd({ target: PriceRangeDragTarget.LiquidityArea, startRange: INITIAL })
    expect(onRangeDragEnd).not.toHaveBeenCalled()

    handleRangeDragEnd({
      target: PriceRangeDragTarget.LiquidityArea,
      startRange: { minTick: INITIAL.minTick, maxTick: INITIAL.maxTick + TICK_SPACING },
    })
    expect(onRangeDragEnd).toHaveBeenCalledExactlyOnceWith(PriceRangeDragTarget.LiquidityArea)
  })

  it('tolerates a store created without a listener', () => {
    const { store } = createDragStore()

    expect(() =>
      store.getState().actions.handleRangeDragEnd({
        target: PriceRangeDragTarget.LiquidityArea,
        startRange: { minTick: 0, maxTick: TICK_SPACING },
      }),
    ).not.toThrow()
  })
})
