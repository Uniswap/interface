/**
 * Native stub for the web-only tooltip compat. The native leg is deferred
 * per INFRA-3021 (the compat targets the web Tamagui → Tailwind migration;
 * native rendering arrives with the uniwind track). Components and className
 * compilers throw at render/call time so an accidental native import fails
 * loudly instead of silently rendering nothing. Platform-neutral values
 * (delay/offset defaults, the frame-default style object, the pure delay
 * mapper, an inert config context) are exported for real so cross-platform
 * importers resolve every symbol the web leg exports — a missing export
 * would surface as an opaque bundler resolution error instead.
 */
import * as React from 'react'
import { mapTooltipDelay, TOOLTIP_DEFAULT_DELAY, TOOLTIP_DEFAULT_OFFSET, TOOLTIP_DEFAULT_REST_MS } from './compile'
import type { TooltipCompatConfigContextValue } from './TooltipCompat'

// Pure data + pure mapping — safe (and meaningful) off-web; re-exported so
// values never drift.
export {
  mapTooltipDelay,
  TOOLTIP_CONTENT_FRAME_DEFAULTS,
  TOOLTIP_DEFAULT_DELAY,
  TOOLTIP_DEFAULT_OFFSET,
  TOOLTIP_DEFAULT_REST_MS,
} from './compile'
export type {
  PopoverCompatOffset,
  PopoverCompatPlacement,
  TooltipAnimationDirection,
  TooltipArrowCompatProps,
  TooltipCompatDelay,
  TooltipCompatProps,
  TooltipCompatTriggerProps,
  TooltipContentCompatProps,
  TooltipContentOwnProps,
  TooltipRootInertProps,
} from './props'
export type { TooltipCompatConfigContextValue } from './TooltipCompat'

/**
 * Inert stand-in for the web config context (the real one lives next to the
 * Base-UI-backed root, which cannot load on native). Carries the same
 * default value as the web provider's fallback.
 */
export const TooltipCompatConfigContext = React.createContext<TooltipCompatConfigContextValue>({
  offset: TOOLTIP_DEFAULT_OFFSET,
  ...mapTooltipDelay({ delay: TOOLTIP_DEFAULT_DELAY, restMs: TOOLTIP_DEFAULT_REST_MS }),
})

function throwNativeStub(name: string): never {
  throw new Error(`${name} is web-only; the native leg is deferred (INFRA-3021).`)
}

function TooltipCompatRoot(): never {
  return throwNativeStub('TooltipCompat')
}

export const TooltipCompat = Object.assign(TooltipCompatRoot, {
  Trigger: function TooltipCompatTrigger(): never {
    return throwNativeStub('TooltipCompat.Trigger')
  },
  Content: function TooltipCompatContent(): never {
    return throwNativeStub('TooltipCompat.Content')
  },
  Arrow: function TooltipCompatArrow(): never {
    return throwNativeStub('TooltipCompat.Arrow')
  },
})

export function tooltipContentCompatClassName(): never {
  return throwNativeStub('tooltipContentCompatClassName')
}

export function tooltipContentFrameClassName(): never {
  return throwNativeStub('tooltipContentFrameClassName')
}

export function tooltipArrowCompatClassName(): never {
  return throwNativeStub('tooltipArrowCompatClassName')
}

export function tooltipArrowInnerCompatClassName(): never {
  return throwNativeStub('tooltipArrowInnerCompatClassName')
}

export function tooltipMotionClasses(): never {
  return throwNativeStub('tooltipMotionClasses')
}
