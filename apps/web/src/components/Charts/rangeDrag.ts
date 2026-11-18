import type { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts'

/** A price range in a series' plotted units. An undefined edge is open and has no line to grab. */
export type DraggableRange = { lower?: number; upper?: number }

type RangeEdge = 'lower' | 'upper'

// How close, in pixels, the pointer has to be to an edge's line to grab it.
const GRAB_DISTANCE_PX = 6

/** The edge whose line is nearest `y`, if one is within grabbing distance. */
export function findGrabbedEdge({
  y,
  range,
  priceToCoordinate,
}: {
  y: number
  range: DraggableRange
  priceToCoordinate: (price: number) => number | null
}): RangeEdge | undefined {
  let nearest: { edge: RangeEdge; distance: number } | undefined
  for (const edge of ['lower', 'upper'] as const) {
    const price = range[edge]
    const coordinate = price === undefined ? null : priceToCoordinate(price)
    if (coordinate === null) {
      continue
    }
    const distance = Math.abs(coordinate - y)
    if (distance <= GRAB_DISTANCE_PX && (!nearest || distance < nearest.distance)) {
      nearest = { edge, distance }
    }
  }
  return nearest?.edge
}

/** Moves one edge to `price`, stopping it at the other edge rather than letting the two cross. */
export function moveDraggedEdge({
  range,
  edge,
  price,
}: {
  range: DraggableRange
  edge: RangeEdge
  price: number
}): DraggableRange {
  return edge === 'lower'
    ? { ...range, lower: range.upper === undefined ? price : Math.min(price, range.upper) }
    : { ...range, upper: range.lower === undefined ? price : Math.max(price, range.lower) }
}

/**
 * Lets the pointer drag a range's edge lines along the price axis. While an edge is held the chart's own
 * panning is paused, `onPreview` follows the pointer, and `onCommit` gets the range on release; a cancelled
 * drag previews the range it started from. `onEnd` follows either. Returns the cleanup.
 */
export function attachRangeDrag({
  chartDiv,
  api,
  getSeries,
  getRange,
  onPreview,
  onCommit,
  onEnd,
}: {
  chartDiv: HTMLDivElement
  api: IChartApi
  getSeries: () => ISeriesApi<SeriesType>
  /** The range that can be dragged right now; undefined when there's nothing to drag. */
  getRange: () => DraggableRange | undefined
  onPreview: (range: DraggableRange) => void
  onCommit: (range: DraggableRange) => void
  onEnd?: () => void
}): () => void {
  let drag:
    | {
        edge: RangeEdge
        start: DraggableRange
        range: DraggableRange
        restoreOptions: Pick<ReturnType<IChartApi['options']>, 'handleScroll' | 'handleScale'>
      }
    | undefined

  const getY = (event: PointerEvent) => event.clientY - chartDiv.getBoundingClientRect().top
  const getGrabbedEdge = (y: number) => {
    const range = getRange()
    const series = getSeries()
    return range
      ? findGrabbedEdge({ y, range, priceToCoordinate: (price) => series.priceToCoordinate(price) })
      : undefined
  }

  // Capture phase, so panning is off before the chart sees the press.
  const onPointerDown = (event: PointerEvent) => {
    // A finger's vertical drag pans the page (the chart leaves vertical touch to it), which would cancel the
    // drag mid-way; on touch the edges are set in the editor's boxes instead.
    if (event.pointerType === 'touch') {
      return
    }
    const range = getRange()
    const edge = event.button === 0 ? getGrabbedEdge(getY(event)) : undefined
    if (!range || !edge) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    chartDiv.setPointerCapture(event.pointerId)
    const { handleScroll, handleScale } = api.options()
    api.applyOptions({ handleScroll: false, handleScale: false })
    drag = { edge, start: range, range, restoreOptions: { handleScroll, handleScale } }
  }

  const onPointerMove = (event: PointerEvent) => {
    const y = getY(event)
    if (!drag) {
      chartDiv.style.cursor = getGrabbedEdge(y) ? 'ns-resize' : ''
      return
    }
    const price = getSeries().coordinateToPrice(y)
    if (price === null || Number(price) <= 0) {
      return
    }
    drag.range = moveDraggedEdge({ range: drag.range, edge: drag.edge, price: Number(price) })
    onPreview(drag.range)
  }

  const endDrag = (event: PointerEvent) => {
    if (!drag) {
      return
    }
    const { start, range, restoreOptions } = drag
    drag = undefined
    if (chartDiv.hasPointerCapture(event.pointerId)) {
      chartDiv.releasePointerCapture(event.pointerId)
    }
    api.applyOptions(restoreOptions)
    if (event.type === 'pointercancel') {
      onPreview(start)
    } else if (range !== start) {
      // A press with no move leaves the range as it was: committing it would still mark it a custom range.
      onCommit(range)
    }
    onEnd?.()
  }

  chartDiv.addEventListener('pointerdown', onPointerDown, { capture: true })
  chartDiv.addEventListener('pointermove', onPointerMove)
  chartDiv.addEventListener('pointerup', endDrag)
  chartDiv.addEventListener('pointercancel', endDrag)
  return () => {
    // Detached mid-drag (the chart unmounting): end it, so the preview it set doesn't outlive it.
    if (drag) {
      api.applyOptions(drag.restoreOptions)
      drag = undefined
      onEnd?.()
    }
    chartDiv.removeEventListener('pointerdown', onPointerDown, { capture: true })
    chartDiv.removeEventListener('pointermove', onPointerMove)
    chartDiv.removeEventListener('pointerup', endDrag)
    chartDiv.removeEventListener('pointercancel', endDrag)
    chartDiv.style.cursor = ''
  }
}
