import { zIndexes } from '@universe/mycelium'

/** Full-height pinned-column guide; positioned by the table shell so row layout cannot break it. */
export function TablePinnedColumnOverlay({
  leftPx,
  leftOverride,
  color,
}: {
  leftPx: number
  /** CSS width expression tracking an overridden pinned-region width (see getPinnedRegionWidthCss). */
  leftOverride?: string
  color: string
}): JSX.Element | null {
  if (leftPx <= 0) {
    return null
  }

  return (
    /* oxlint-disable-next-line react/forbid-elements -- table overlay guide */
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: leftOverride ? `calc(${leftOverride} - 1px)` : leftPx - 1,
        width: 1,
        pointerEvents: 'none',
        zIndex: zIndexes.default + 1,
        backgroundColor: color,
      }}
    />
  )
}
