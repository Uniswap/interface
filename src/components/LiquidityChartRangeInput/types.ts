export interface ChartEntry {
  // index: number
  // isCurrent: boolean
  activeLiquidity: number
  price0: number
}

export interface Dimensions {
  width: number
  height: number
}

export interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}

export interface LiquidityChartRangeInputProps {
  // to distringuish between multiple charts in the DOM
  id?: string

  data: {
    series: ChartEntry[]
    current: number
  }

  styles: {
    brush: {
      handle: {
        west: string
        east: string
      }
    }
  }

  dimensions: Dimensions
  margins: Margins

  interactive?: boolean

  brushLabels: (x: number) => string
  brushDomain: [number, number] | undefined
  onBrushDomainChange: (domain: [number, number]) => void

  initialZoom: number
}
