import { zIndexes } from 'ui/src/theme'

/** Full-height pinned-column guide; positioned by the table shell so row layout cannot break it. */
export function TablePinnedColumnOverlay({ leftPx, color }: { leftPx: number; color: string }): JSX.Element | null {
  if (leftPx <= 0) {
    return null
  }

  return (
    /* oxlint-disable-next-line eslint-plugin-react(forbid-elements) -- table overlay guide */
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: leftPx - 1,
        width: 1,
        pointerEvents: 'none',
        zIndex: zIndexes.default + 1,
        backgroundColor: color,
      }}
    />
  )
}
