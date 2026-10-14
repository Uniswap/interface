import type { FlexProps } from '@universe/mycelium'
import { EffectiveOverlayZIndexContext } from '@universe/mycelium/popover-compat'
import { createContext, createElement } from 'react'
import type { PropsWithChildren, ReactElement } from 'react'
export const ADAPTIVE_MODAL_ANIMATION_DURATION = 200

// TODO: move to the shared TestID enum once it's removed from the uniswap package
export const WEB_BOTTOM_SHEET_OVERLAY_TEST_ID = 'uniswap-web-bottom-sheet-overlay'

/**
 * Provides the effective z-index of the current modal/sheet/overlay layer so descendants stack above it.
 * Consumed by `Tooltip.Content`, `AdaptiveWebPopoverContent`, `AdaptiveWebModal`,
 * `WebModalWithBottomAttachment`, and standalone `WebBottomSheet` — each renders one layer above
 * (via {@link stackingLayerAbove}) and re-provides the bumped value to its own descendants.
 *
 * Set explicitly by the dapp-request queue at `zIndexes.overlay` so any modal nested inside it
 * (e.g. `NetworkCostEditorModal`) automatically stacks above without per-call-site z-index plumbing.
 */
export const EffectiveModalOrSheetZIndexContext = createContext<number | undefined>(undefined)

/**
 * Every legacy overlay host provides both this context and mycelium's
 * `EffectiveOverlayZIndexContext` with the same value (INFRA-3819), so a
 * converted descendant reading only the mycelium context gets the right
 * stacking layer under an unconverted host too — the bridge dies with the
 * legacy hosts, never needing a per-call-site conversion facade.
 */
export function DualZIndexProvider({
  value,
  children,
}: PropsWithChildren<{ value: number | undefined }>): ReactElement {
  return createElement(
    EffectiveModalOrSheetZIndexContext.Provider,
    { value },
    createElement(EffectiveOverlayZIndexContext.Provider, { value }, children),
  )
}

// Re-exported rather than duplicated: a converted host and an unconverted one must compute the
// same stacking layer for the same nesting depth (INFRA-3819).
export { stackingLayerAbove } from '@universe/mycelium/popover-compat'

export type WebModalSnapPointsMode = 'fit' | 'percent' | 'constant' | 'mixed'

/** Fit-mode frame height. `ratchet` holds the tallest height; `content` shrinks when content collapses. */
export type SheetFitHeight = 'ratchet' | 'content'

export type ModalProps = FlexProps &
  PropsWithChildren<{
    isOpen: boolean
    onClose?: () => void
    adaptToSheet?: boolean
    alignment?: 'center' | 'top'
    hideHandlebar?: boolean
    snapPointsMode?: WebModalSnapPointsMode
    snapPoints?: Array<string | number>
    sheetFitHeight?: SheetFitHeight
    overlayOpacity?: number
    borderColor?: string
    zIndex?: number
    disableRemoveScroll?: boolean // skips the built-in scroll lock for self-locking callers
  }>
