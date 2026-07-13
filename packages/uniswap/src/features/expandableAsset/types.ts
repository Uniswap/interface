import type { ReactNode } from 'react'
import type { ModifierPressProps } from 'ui/src'
import type { IssuerToken } from 'uniswap/src/data/rest/rwa/types'

export type ExpandableAssetGroupVariant = 'table' | 'search'

export const TABLE_SUBLINE_HEIGHT = 18

/** Controlled menu open-state shared between the shell (native long-press) and the row (web …/right-click). */
export type IssuerMenuControl = {
  isOpen: boolean
  openMenu: () => void
  closeMenu: () => void
}

/**
 * Args for a `renderIssuerRow` render-prop, threaded ExpandableAssetGroup → ExpandableIssuerRows → row factory.
 * Every field is optional or structural, so this single shared shape (rather than per-site inline copies) keeps the
 * seam from silently drifting: adding a field here threads it through all consumers at compile time.
 */
export type RenderIssuerRowArgs = ModifierPressProps & {
  issuer: IssuerToken
  isRowFocused: boolean
  onPress: () => void
  /** Expanded sub-rows: true (own the single TouchableArea). Collapsed single-issuer row: false (shell owns tap). */
  ownsTouchable: boolean
  /** Controlled menu open-state, supplied only for the collapsed single-issuer row (so the shell's native
   *  long-press shares it). Omitted for expanded sub-rows → the row owns its own state. */
  menuControl?: IssuerMenuControl
  children: ReactNode
}
