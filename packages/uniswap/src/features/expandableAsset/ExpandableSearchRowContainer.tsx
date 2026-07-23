import type { ReactNode } from 'react'
import type { FocusedRowControl } from 'uniswap/src/components/lists/items/OptionItem'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type ExpandableSearchRowContainerProps = {
  isExpanded: boolean
  /** True when the asset has more than one issuer and can therefore expand. */
  canExpand: boolean
  onToggle: () => void
  /** Called when a single-issuer (non-expandable) row is tapped. */
  onParentPress?: () => void
  /** Called on a long-press of a single-issuer (non-expandable) collapsed row — opens the row's context menu on
   *  native + mobile-web touch. Undefined for multi-issuer/parent rows. Interaction-only; no layout/height change. */
  onParentLongPress?: () => void
  /** URL for the collapsed single-issuer row */
  parentHref?: string
  /** Parent identity + "Stocks" tag + chevron, built by the consumer. */
  header: ReactNode
  /** Issuer sub-rows (an `ExpandableIssuerRows` element), built by the consumer. */
  issuerPanel: ReactNode
  /** Keyboard list-nav control (web) for the parent row's focus highlight + Enter-to-activate. */
  focusedRowControl?: FocusedRowControl
  /** testID applied to the parent row's touchable. */
  testID?: string
  /**
   * Height of the issuer panel alone — `getExpandableIssuerPanelHeightPx({ variant: 'search' })`, NOT the
   * full-row `getExpandableSearchRowHeightPx`. Consumed only by the `.web` split to size the reveal animation;
   * the `.native` split ignores it (FlashList force-sizes the cell from the layout helper instead).
   */
  issuerPanelHeightPx: number
}

/**
 * Search-variant grouped-RWA row. Platform-split: `.web` animates the issuer-panel reveal on expand/collapse,
 * `.native` renders it instantly. The base file is a stub so the extensionless import resolves under
 * `moduleResolution: "bundler"` (the bundlers pick `.web`/`.native`).
 */
export function ExpandableSearchRowContainer(_props: ExpandableSearchRowContainerProps): JSX.Element {
  throw new PlatformSplitStubError('ExpandableSearchRowContainer')
}
