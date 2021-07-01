import { ChartEntry } from '../LiquidityDepth/hooks'

export interface LiquidityChartRangeInputProps {
  // to distringuish between multiple charts in the DOM
  id?: string

  data: {
    series: ChartEntry[]
    current: number
  }

  styles: {
    area: {
      fill: string
      stroke: string
    }

    current: {
      stroke: string
    }

    axis: {
      fill: string
    }

    brush: {
      selection: {
        fill0: string
        fill1: string
      }

      handle: {
        west: string
        east: string
      }

      tooltip: {
        fill: string
        color: string
      }
    }

    focus: {
      stroke: string
    }
  }

  dimensions: Dimensions
  margins: Margins

  brushDomain: [number, number] | undefined
  brushLabels: (x: number) => string | undefined
  onBrushDomainChange: (domain: [number, number]) => void
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
