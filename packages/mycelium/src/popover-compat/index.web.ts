/**
 * Web entry for the popover compat — mirrors the base index.ts (web is the
 * real platform for mycelium; the native leg is a throwing stub, see
 * index.native.ts). Keep the export list in sync with index.ts.
 */
export { AdaptiveWebPopoverContentCompat } from './AdaptiveWebPopoverContentCompat'
export { adaptiveWebPopoverContentCompatClassName } from './compile'
export { PopoverCompat, PopoverCompatPositionContext, type PopoverCompatPositionContextValue } from './PopoverCompat'
export {
  type AnchorPosition,
  mapOffsetToAnchorPosition,
  mapPlacementToAnchorPosition,
  type PopoverCompatAlign,
  type PopoverCompatOffset,
  type PopoverCompatPlacement,
  type PopoverCompatSide,
} from './position'
export type {
  AdaptiveWebPopoverContentCompatProps,
  AdaptiveWebPopoverContentOwnProps,
  PopoverCompatFocusOutsideEvent,
  PopoverCompatPointerDownOutsideEvent,
  PopoverCompatRootProps,
  PopoverCompatTriggerProps,
  PopoverContentFocusScopeCompatProps,
  PopoverContentInertProps,
  PopoverContentStyledVariantProps,
  WebBottomSheetCompatProps,
} from './props'
export { EffectiveOverlayZIndexContext, OVERLAY_Z_INDEXES, stackingLayerAbove, useStackingLayerAbove } from './z-index'
