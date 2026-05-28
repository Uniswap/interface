/**
 * Shared calculations for token logo badges (network logo and multichain count badge)
 * so size and border radius stay consistent.
 */

const SQUIRCLE_BORDER_RADIUS_RATIO = 0.3

export function getBadgeOuterSize(sizeWithoutBorder: number, borderWidth: number): number {
  return sizeWithoutBorder + 2 * borderWidth
}

export function getBadgeBorderRadius(outerSize: number, shape: 'circle' | 'square'): number {
  return shape === 'circle' ? outerSize / 2 : outerSize * SQUIRCLE_BORDER_RADIUS_RATIO
}
