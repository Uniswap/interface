/**
 * The Tamagui-free half of the overlay stacking bridge (INFRA-3021).
 *
 * Legacy overlays coordinate stacking through
 * `EffectiveModalOrSheetZIndexContext` + `stackingLayerAbove` in
 * `ui/src/components/modal/AdaptiveWebModal.tsx`: every modal / sheet /
 * popover layer provides its effective z-index and each nested overlay
 * renders one layer above (with a per-kind floor). Without it, a portaled
 * popup defaults to the browser stacking order (Tamagui portals sit at
 * z≈1000) and lands BEHIND an open modal at z-1060.
 *
 * `EffectiveOverlayZIndexContext` is the mycelium-owned equivalent. During
 * the migration, conversion facades bridge the legacy context value into this
 * one at the modal boundary; mycelium overlays consume and re-provide it
 * exactly like `AdaptiveWebPopoverContent` does today.
 */
import { createContext, useContext } from 'react'

/**
 * Mirror of the overlay-relevant subset of `ui/src/theme/zIndexes.ts`.
 * Values must stay in sync until the zIndex scale moves into
 * `@universe/tailwind` tokens; the popover parity suite pins them.
 */
export const OVERLAY_Z_INDEXES = {
  dropdown: 970,
  modalBackdrop: 1040,
  modal: 1060,
  popoverBackdrop: 1065,
  popover: 1070,
  tooltip: 1080,
  overlay: 100010,
  toast: 100020,
} as const

/** Effective z-index of the hosting modal/sheet/overlay layer, if any. */
export const EffectiveOverlayZIndexContext = createContext<number | undefined>(undefined)

/** One layer above a host (modal, popover, overlay), with a minimum floor for the stacking scale. */
export function stackingLayerAbove(hostZIndex: number | undefined, floor: number): number {
  return Math.max((hostZIndex ?? 0) + 1, floor)
}

/** The stacking layer for a new overlay of the given floor inside the current host layer. */
export function useStackingLayerAbove(floor: number): number {
  return stackingLayerAbove(useContext(EffectiveOverlayZIndexContext), floor)
}
