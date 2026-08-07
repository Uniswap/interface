/**
 * The network-selector chrome (INFRA-3021 dropdown set): the legacy
 * `NetworkFilterV2.web` popover-content payload compiled through the popover
 * compat compiler, plus the literal clamp classes that replace the legacy
 * hand-rolled viewport math. Literal strings only (never
 * template-assembled); the dropdown-set classes suite proves the CSS exists.
 */
import { adaptiveWebPopoverContentCompatClassName } from '../popover-compat/compile'

/** Legacy layout constants (NetworkFilterV2.web.tsx), verbatim. */
export const NETWORK_SELECTOR_DROPDOWN_WIDTH = 240
export const NETWORK_SELECTOR_DESKTOP_MAX_HEIGHT = 320
export const NETWORK_SELECTOR_DROPDOWN_OFFSET = 8

/**
 * The inner content column (`width={240} flexDirection=column minHeight=0
 * overflow=hidden` — the legacy dropdownWidth frame).
 */
export const NETWORK_SELECTOR_CONTENT_FRAME_CLASS_NAME = 'flex w-[240px] min-h-0 flex-col overflow-hidden'

/**
 * The scroll clamp that REPLACES the legacy getViewportConstrainedMaxHeight
 * (scroll/resize listeners + breakpoint guesses — the #36826 bug class): the
 * Base UI positioner measures the real viewport and publishes
 * --available-height; the list caps at the legacy 320px or the actual space,
 * whichever is smaller (16px breathing room mirrors the legacy edge inset).
 */
export const NETWORK_SELECTOR_LIST_MAX_HEIGHT_CLASS_NAME = 'max-h-[min(320px,calc(var(--available-height)-16px))]'

/**
 * The legacy AdaptiveWebPopoverContent call-site payload
 * (NetworkFilterV2.web.tsx), verbatim minus the platform shadow hook —
 * compiled through the popover compat compiler so the popup frame matches
 * the converted host byte-for-byte.
 */
export const NETWORK_SELECTOR_POPOVER_CONTENT_PROPS_COMPAT = {
  backgroundColor: '$surface1',
  borderColor: '$surface3',
  borderRadius: '$rounded24',
  borderWidth: 1,
  px: '$spacing4',
  pb: '$none',
  overflow: 'hidden',
} as const

export function networkSelectorPopupClassName(placement?: 'bottom-end'): string {
  return adaptiveWebPopoverContentCompatClassName({
    ...NETWORK_SELECTOR_POPOVER_CONTENT_PROPS_COMPAT,
    placement: placement ?? 'bottom-end',
  })
}
