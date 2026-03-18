interface NiceStepParams {
  minValue: number
  maxValue: number
  maxLabels: number
}

export function getNiceStepForMaxLabels({ minValue, maxValue, maxLabels }: NiceStepParams): number {
  const safeMaxLabels = Number.isFinite(maxLabels) && maxLabels > 1 ? Math.floor(maxLabels) : 2
  const safeMin = Number.isFinite(minValue) ? minValue : 0
  const safeMax = Number.isFinite(maxValue) ? maxValue : safeMin

  const range = safeMax - safeMin
  const safeRange = range > 0 ? range : Math.max(Math.abs(safeMax), 1)
  const rawStep = safeRange / (safeMaxLabels - 1)

  if (!Number.isFinite(rawStep) || rawStep <= 0) {
    return 1
  }

  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude

  let niceNormalized: number
  if (normalized <= 1) {
    niceNormalized = 1
  } else if (normalized <= 2) {
    niceNormalized = 2
  } else if (normalized <= 2.5) {
    niceNormalized = 2.5
  } else if (normalized <= 5) {
    niceNormalized = 5
  } else {
    niceNormalized = 10
  }

  return niceNormalized * magnitude
}

export function getPrecisionForMinMove(minMove: number): number {
  if (!Number.isFinite(minMove) || minMove <= 0) {
    return 0
  }

  const text = minMove.toString()
  if (text.includes('e-')) {
    const [, exponent] = text.split('e-')
    const parsed = Number.parseInt(exponent, 10)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const [, decimals] = text.split('.')
  return decimals ? decimals.length : 0
}
