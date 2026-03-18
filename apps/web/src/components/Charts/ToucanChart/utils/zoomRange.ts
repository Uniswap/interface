import { ZOOM_TOLERANCE } from '~/components/Toucan/Auction/BidDistributionChart/constants'

// Minimum chart range in units (prevents division by zero and ensures valid range for lightweight-charts)
const MIN_CHART_RANGE = 1

interface ZoomRange {
  from: number
  to: number
}

export function calculateZoomedRange(params: {
  currentFrom: number
  currentTo: number
  fullFrom: number
  fullTo: number
  zoomFactor: number
  minRange?: number
}): ZoomRange {
  const { currentFrom, currentTo, fullFrom, fullTo, zoomFactor, minRange = MIN_CHART_RANGE } = params
  const fullRange = Math.max(MIN_CHART_RANGE, fullTo - fullFrom)
  const currentRange = Math.max(MIN_CHART_RANGE, currentTo - currentFrom)
  const nextRange = Math.min(fullRange, Math.max(minRange, currentRange * zoomFactor))
  const midpoint = (currentFrom + currentTo) / 2

  let from = midpoint - nextRange / 2
  let to = midpoint + nextRange / 2

  if (from < fullFrom) {
    from = fullFrom
    to = from + nextRange
  }

  if (to > fullTo) {
    to = fullTo
    from = to - nextRange
  }

  // Ensure from doesn't go below fullFrom after the to > fullTo correction
  if (from < fullFrom) {
    from = fullFrom
  }

  return { from, to }
}

export function getIsZoomed(params: {
  currentFrom: number
  currentTo: number
  fullFrom: number
  fullTo: number
}): boolean {
  const { currentFrom, currentTo, fullFrom, fullTo } = params
  const fullRange = Math.max(MIN_CHART_RANGE, fullTo - fullFrom)
  const currentRange = Math.max(MIN_CHART_RANGE, currentTo - currentFrom)

  return (
    Math.abs(currentFrom - fullFrom) > fullRange * ZOOM_TOLERANCE ||
    Math.abs(currentTo - fullTo) > fullRange * ZOOM_TOLERANCE ||
    Math.abs(currentRange - fullRange) > fullRange * ZOOM_TOLERANCE
  )
}
