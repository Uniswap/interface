/**
 * Web entry for the tooltip compat — mirrors the base index.ts (web is the
 * real platform for mycelium; the native leg is a throwing stub, see
 * index.native.ts). Keep the export list in sync with index.ts.
 */
export {
  mapTooltipDelay,
  TOOLTIP_CONTENT_FRAME_DEFAULTS,
  TOOLTIP_DEFAULT_DELAY,
  TOOLTIP_DEFAULT_OFFSET,
  TOOLTIP_DEFAULT_REST_MS,
  tooltipArrowCompatClassName,
  tooltipArrowInnerCompatClassName,
  tooltipContentCompatClassName,
  tooltipContentFrameClassName,
  tooltipMotionClasses,
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
export { TooltipCompat, TooltipCompatConfigContext, type TooltipCompatConfigContextValue } from './TooltipCompat'
