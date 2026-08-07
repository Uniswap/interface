/**
 * Native stub for the web-only popover compat. The native leg is deferred
 * per INFRA-3021 (the compat targets the web Tamagui → Tailwind migration;
 * native rendering arrives with the uniwind track). Components and compilers
 * throw at render/call time so an accidental native import fails loudly
 * instead of silently rendering nothing. Platform-neutral values (the z-index
 * bridge, an inert position context) are exported for real so cross-platform
 * importers resolve every symbol the web leg exports — a missing export would
 * surface as an opaque bundler resolution error instead.
 */
import * as React from 'react'
import type { PopoverCompatPositionContextValue } from './PopoverCompat'

export type { PopoverCompatPositionContextValue } from './PopoverCompat'
export type {
  AnchorPosition,
  PopoverCompatAlign,
  PopoverCompatOffset,
  PopoverCompatPlacement,
  PopoverCompatSide,
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
// The z-index bridge is pure react + data — safe (and meaningful) on native.
export { EffectiveOverlayZIndexContext, OVERLAY_Z_INDEXES, stackingLayerAbove, useStackingLayerAbove } from './z-index'

/**
 * Inert stand-in for the web position context (the real one lives next to the
 * Base-UI-backed root, which cannot load on native).
 */
export const PopoverCompatPositionContext = React.createContext<PopoverCompatPositionContextValue>({})

function throwNativeStub(name: string): never {
  throw new Error(`${name} is web-only; the native leg is deferred (INFRA-3021).`)
}

export function AdaptiveWebPopoverContentCompat(): never {
  return throwNativeStub('AdaptiveWebPopoverContentCompat')
}

export function adaptiveWebPopoverContentCompatClassName(): never {
  return throwNativeStub('adaptiveWebPopoverContentCompatClassName')
}

function PopoverCompatRoot(): never {
  return throwNativeStub('PopoverCompat')
}

export const PopoverCompat = Object.assign(PopoverCompatRoot, {
  Trigger: function PopoverCompatTrigger(): never {
    return throwNativeStub('PopoverCompat.Trigger')
  },
})

export function mapPlacementToAnchorPosition(): never {
  return throwNativeStub('mapPlacementToAnchorPosition')
}

export function mapOffsetToAnchorPosition(): never {
  return throwNativeStub('mapOffsetToAnchorPosition')
}
