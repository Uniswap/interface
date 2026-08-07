/**
 * Native stub for the web-only network-selector compat. The native leg is
 * deferred per INFRA-3021 (native keeps the legacy NetworkFilterV2.native
 * implementation until the uniwind track lands). The component and the
 * popup-class compiler throw at render/call time so an accidental native
 * import fails loudly; platform-neutral values (layout constants, the
 * verbatim legacy style payload, literal clamp classes as data) are exported
 * for real so cross-platform importers resolve every symbol the web leg
 * exports.
 */

// Pure data — safe off-web; re-exported so values never drift.
export {
  NETWORK_SELECTOR_CONTENT_FRAME_CLASS_NAME,
  NETWORK_SELECTOR_DESKTOP_MAX_HEIGHT,
  NETWORK_SELECTOR_DROPDOWN_OFFSET,
  NETWORK_SELECTOR_DROPDOWN_WIDTH,
  NETWORK_SELECTOR_LIST_MAX_HEIGHT_CLASS_NAME,
  NETWORK_SELECTOR_POPOVER_CONTENT_PROPS_COMPAT,
} from './compile'
export type {
  NetworkSelectorChainDisplayCompat,
  NetworkSelectorCompatProps,
  NetworkSelectorLabelsCompat,
  NetworkSelectorOptionCompat,
  NetworkSelectorTelemetryAdapterCompat,
  TieredNetworkOptionsCompat,
} from './types'

function throwNativeStub(name: string): never {
  throw new Error(`${name} is web-only; the native leg is deferred (INFRA-3021).`)
}

export function NetworkSelectorCompat(): never {
  return throwNativeStub('NetworkSelectorCompat')
}

export function networkSelectorPopupClassName(): never {
  return throwNativeStub('networkSelectorPopupClassName')
}
