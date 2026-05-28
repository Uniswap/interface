import type React from 'react'

export interface PercentageAllocationItem {
  id: string
  percentage: number
  color: string
  label: string
  icon?: React.ReactNode
}

export interface AdjustedChartItem extends PercentageAllocationItem {
  style: {
    width: string
    flexShrink: number
  }
}
