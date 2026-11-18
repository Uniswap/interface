import type { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts'
import { noop } from 'utilities/src/react/noop'
import type { RangeBandDrawParams, RangeBandOverlay } from '~/components/Charts/PriceChart/RangeBandOverlay'
import type { DraggableRange } from '~/components/Charts/rangeDrag'

type RangeDragHandlers = {
  chartDiv: HTMLDivElement
  api: IChartApi
  getSeries: () => ISeriesApi<SeriesType>
  /** The range that can be dragged right now; undefined when there's nothing to drag. */
  getRange: () => DraggableRange | undefined
  onPreview: (range: DraggableRange) => void
  onCommit: (range: DraggableRange) => void
  onEnd?: () => void
}

/**
 * A price chart's range band and its drag, loaded with the first band drawn. The price chart is in the
 * initial bundle (`/swap` renders one), and only the pool details page draws a range, so the band's
 * drawing and drag code stay out of every other page. Until it loads, the latest band waits and is drawn
 * once it does.
 */
export class LazyRangeBand {
  private overlay: RangeBandOverlay | undefined
  private detachDrag: () => void = noop
  private pending: RangeBandDrawParams | undefined
  private isRequested = false
  private isRemoved = false

  constructor(private readonly drag: RangeDragHandlers) {}

  draw(params: RangeBandDrawParams): void {
    if (this.overlay) {
      this.overlay.draw(params)
      return
    }
    this.pending = params
    this.load()
  }

  clear(): void {
    this.pending = undefined
    this.overlay?.clear()
  }

  reattach(series: ISeriesApi<SeriesType>): void {
    this.overlay?.reattach(series)
  }

  remove(): void {
    this.isRemoved = true
    this.detachDrag()
    this.clear()
  }

  private load(): void {
    if (this.isRequested) {
      return
    }
    this.isRequested = true
    void Promise.all([
      import('~/components/Charts/PriceChart/RangeBandOverlay'),
      import('~/components/Charts/rangeDrag'),
    ]).then(([{ RangeBandOverlay }, { attachRangeDrag }]) => {
      if (this.isRemoved) {
        return
      }
      this.overlay = new RangeBandOverlay(this.drag.getSeries())
      this.detachDrag = attachRangeDrag(this.drag)
      if (this.pending) {
        this.overlay.draw(this.pending)
        this.pending = undefined
      }
    })
  }
}
