import type { CSSProperties } from 'react'

export const MARKER_DOT_PX = 2

export const MARKER_DOT_GAP_PX = 2

export function dottedMarkerStyle(color: string): CSSProperties {
  const radius = MARKER_DOT_PX / 2
  return {
    width: MARKER_DOT_PX,
    backgroundImage: `radial-gradient(circle, ${color} 0 ${radius}px, transparent ${radius}px)`,
    backgroundSize: `${MARKER_DOT_PX}px ${MARKER_DOT_PX + MARKER_DOT_GAP_PX}px`,
    backgroundRepeat: 'repeat-y',
  }
}
