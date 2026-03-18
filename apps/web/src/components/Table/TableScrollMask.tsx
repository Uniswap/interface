import { styled, View } from 'ui/src'
import { zIndexes } from 'ui/src/theme'

/** Right-edge fade overlay when table has pinned columns and can scroll horizontally. Used in both header (SideScrollButtons) and body areas. */
export const TableScrollMask = styled(View, {
  position: 'absolute',
  zIndex: zIndexes.default,
  top: 0,
  bottom: 0,
  right: 1,
  width: 20,
  pointerEvents: 'none',
  background: `linear-gradient(to right, transparent, var(--surface1))`,
})
