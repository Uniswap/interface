import type { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts'
import { describe, expect, it } from 'vitest'
import { attachRangeDrag, findGrabbedEdge, moveDraggedEdge } from '~/components/Charts/rangeDrag'

// One pixel per unit of price, measured down from the top: a price of 100 sits at y = 100.
const priceToCoordinate = (price: number) => price

describe('findGrabbedEdge', () => {
  it('grabs the edge whose line is under the pointer', () => {
    expect(findGrabbedEdge({ y: 52, range: { lower: 50, upper: 150 }, priceToCoordinate })).toBe('lower')
    expect(findGrabbedEdge({ y: 147, range: { lower: 50, upper: 150 }, priceToCoordinate })).toBe('upper')
  })

  it('grabs nothing away from both lines', () => {
    expect(findGrabbedEdge({ y: 100, range: { lower: 50, upper: 150 }, priceToCoordinate })).toBeUndefined()
  })

  it('grabs the nearer edge when both lines are close', () => {
    expect(findGrabbedEdge({ y: 103, range: { lower: 100, upper: 104 }, priceToCoordinate })).toBe('upper')
  })

  it('never grabs an open edge', () => {
    expect(findGrabbedEdge({ y: 150, range: { lower: 50 }, priceToCoordinate })).toBeUndefined()
  })
})

describe('moveDraggedEdge', () => {
  it('moves only the dragged edge', () => {
    expect(moveDraggedEdge({ range: { lower: 50, upper: 150 }, edge: 'lower', price: 70 })).toEqual({
      lower: 70,
      upper: 150,
    })
  })

  it('stops an edge at the other rather than crossing it', () => {
    expect(moveDraggedEdge({ range: { lower: 50, upper: 150 }, edge: 'lower', price: 200 })).toEqual({
      lower: 150,
      upper: 150,
    })
    expect(moveDraggedEdge({ range: { lower: 50, upper: 150 }, edge: 'upper', price: 10 })).toEqual({
      lower: 50,
      upper: 50,
    })
  })

  it('moves freely against an open edge', () => {
    expect(moveDraggedEdge({ range: { lower: 50 }, edge: 'lower', price: 500 })).toEqual({ lower: 500 })
  })
})

describe('attachRangeDrag', () => {
  // jsdom has no PointerEvent, so a MouseEvent carries the pointer fields the handlers read.
  function pointer(type: string, { y, pointerType = 'mouse' }: { y: number; pointerType?: string }): Event {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientY: y, button: 0 })
    Object.assign(event, { pointerId: 1, pointerType })
    return event
  }

  function setup() {
    const chartDiv = document.createElement('div')
    Object.assign(chartDiv, {
      setPointerCapture: vi.fn(),
      hasPointerCapture: () => true,
      releasePointerCapture: vi.fn(),
    })
    const options = { handleScroll: true, handleScale: true }
    const api = {
      options: () => options,
      applyOptions: vi.fn((next: Partial<typeof options>) => Object.assign(options, next)),
    } as unknown as IChartApi
    // One pixel per unit of price, as above.
    const series = { priceToCoordinate, coordinateToPrice: (y: number) => y } as unknown as ISeriesApi<SeriesType>
    const handlers = { onPreview: vi.fn(), onCommit: vi.fn(), onEnd: vi.fn() }
    const detach = attachRangeDrag({
      chartDiv,
      api,
      getSeries: () => series,
      getRange: () => ({ lower: 50, upper: 150 }),
      ...handlers,
    })
    return { chartDiv, options, detach, ...handlers }
  }

  it('commits the dragged range on release and restores the chart’s panning', () => {
    const { chartDiv, options, onPreview, onCommit, onEnd } = setup()

    chartDiv.dispatchEvent(pointer('pointerdown', { y: 150 }))
    expect(options.handleScroll).toBe(false)
    chartDiv.dispatchEvent(pointer('pointermove', { y: 170 }))
    chartDiv.dispatchEvent(pointer('pointerup', { y: 170 }))

    expect(onPreview).toHaveBeenLastCalledWith({ lower: 50, upper: 170 })
    expect(onCommit).toHaveBeenCalledWith({ lower: 50, upper: 170 })
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(options).toEqual({ handleScroll: true, handleScale: true })
  })

  it('reverts a cancelled drag to where it started', () => {
    const { chartDiv, onPreview, onCommit } = setup()

    chartDiv.dispatchEvent(pointer('pointerdown', { y: 150 }))
    chartDiv.dispatchEvent(pointer('pointermove', { y: 170 }))
    chartDiv.dispatchEvent(pointer('pointercancel', { y: 170 }))

    expect(onPreview).toHaveBeenLastCalledWith({ lower: 50, upper: 150 })
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commits nothing for a press on an edge that never moves', () => {
    const { chartDiv, onCommit, onEnd } = setup()

    chartDiv.dispatchEvent(pointer('pointerdown', { y: 150 }))
    chartDiv.dispatchEvent(pointer('pointerup', { y: 150 }))

    expect(onCommit).not.toHaveBeenCalled()
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('leaves a touch to the page', () => {
    const { chartDiv, options, onPreview } = setup()

    chartDiv.dispatchEvent(pointer('pointerdown', { y: 150, pointerType: 'touch' }))
    chartDiv.dispatchEvent(pointer('pointermove', { y: 170, pointerType: 'touch' }))

    expect(options.handleScroll).toBe(true)
    expect(onPreview).not.toHaveBeenCalled()
  })

  it('ends a drag still held when it’s detached', () => {
    const { chartDiv, options, detach, onEnd } = setup()

    chartDiv.dispatchEvent(pointer('pointerdown', { y: 150 }))
    detach()

    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(options.handleScroll).toBe(true)
  })
})
