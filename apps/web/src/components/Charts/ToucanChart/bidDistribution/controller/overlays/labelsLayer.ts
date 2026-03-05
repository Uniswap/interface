import type { IChartApi } from 'lightweight-charts'
import { LABEL_CONFIG } from '~/components/Toucan/Auction/BidDistributionChart/constants'

export function createLabelsLayer(): HTMLDivElement {
  const labelsLayer = document.createElement('div')
  Object.assign(labelsLayer.style, {
    position: 'absolute',
    left: '0',
    bottom: `${LABEL_CONFIG.BOTTOM_POSITION}px`,
    width: '100%',
    height: `${LABEL_CONFIG.HEIGHT}px`,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'stretch',
    overflow: 'visible',
  })
  return labelsLayer
}

export function updateLabelsLayer(params: {
  labelsLayer: HTMLDivElement
  chart: IChartApi
  priceScaleFactor: number
  renderLabels: (params: {
    labelsLayer: HTMLDivElement
    chart: IChartApi
    plotLeft: number
    plotWidth: number
    priceScaleFactor: number
  }) => void
}): void {
  const { labelsLayer, chart, priceScaleFactor, renderLabels } = params

  const plotLeft = Math.round(chart.priceScale('left').width())
  const plotWidth = Math.round(chart.paneSize().width)

  labelsLayer.style.left = `${plotLeft}px`
  labelsLayer.style.width = `${plotWidth}px`

  // The labels layer starts at plotLeft, so labels should be positioned relative to it.
  renderLabels({ labelsLayer, chart, plotLeft: 0, plotWidth, priceScaleFactor })
}
