import { SLIDER_CURVE_K } from '~/features/Toucan/Shared/valuationSliderParts/constants'

const EXP_K_MINUS_1 = Math.exp(SLIDER_CURVE_K) - 1

interface MappingParams {
  maxTickOffset: number
  resolution: number
}

export function positionToTickOffset({
  position,
  maxTickOffset,
  resolution,
}: MappingParams & { position: number }): number {
  if (maxTickOffset <= 0 || resolution <= 0) {
    return 0
  }
  if (position <= 0) {
    return 0
  }
  if (position >= resolution) {
    return maxTickOffset
  }
  const t = position / resolution
  const raw = (Math.exp(SLIDER_CURVE_K * t) - 1) / EXP_K_MINUS_1
  return Math.min(maxTickOffset, Math.max(0, Math.round(raw * maxTickOffset)))
}

export function tickOffsetToPosition({
  tickOffset,
  maxTickOffset,
  resolution,
}: MappingParams & { tickOffset: number }): number {
  if (maxTickOffset <= 0 || resolution <= 0) {
    return 0
  }
  if (tickOffset <= 0) {
    return 0
  }
  if (tickOffset >= maxTickOffset) {
    return resolution
  }
  const ratio = tickOffset / maxTickOffset
  const t = Math.log(ratio * EXP_K_MINUS_1 + 1) / SLIDER_CURVE_K
  return Math.min(resolution, Math.max(0, Math.round(t * resolution)))
}
