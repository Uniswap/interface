/**
 * Web entry for the network-selector compat — mirrors the base index.ts
 * (web is the real platform for mycelium; the native leg throws for the
 * component and compiler, see index.native.ts). Keep the export list in
 * sync with index.ts.
 */
export {
  NETWORK_SELECTOR_CONTENT_FRAME_CLASS_NAME,
  NETWORK_SELECTOR_DESKTOP_MAX_HEIGHT,
  NETWORK_SELECTOR_DROPDOWN_OFFSET,
  NETWORK_SELECTOR_DROPDOWN_WIDTH,
  NETWORK_SELECTOR_LIST_MAX_HEIGHT_CLASS_NAME,
  NETWORK_SELECTOR_POPOVER_CONTENT_PROPS_COMPAT,
  networkSelectorPopupClassName,
} from './compile'
export { NetworkSelectorCompat } from './NetworkSelectorCompat'
export type {
  NetworkSelectorChainDisplayCompat,
  NetworkSelectorCompatProps,
  NetworkSelectorLabelsCompat,
  NetworkSelectorOptionCompat,
  NetworkSelectorTelemetryAdapterCompat,
  TieredNetworkOptionsCompat,
} from './types'
