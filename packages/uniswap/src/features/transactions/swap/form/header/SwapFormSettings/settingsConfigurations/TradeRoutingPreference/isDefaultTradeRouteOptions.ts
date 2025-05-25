import {
  DEFAULT_PROTOCOL_OPTIONS,
  type FrontendSupportedProtocol,
} from 'uniswap/src/features/transactions/swap/utils/protocols'

export function isDefaultTradeRouteOptions(
  selectedProtocols: FrontendSupportedProtocol[],
  isV4HookPoolsEnabled: boolean,
  isV4HooksToggleFFEnabled: boolean,
): boolean {
  return (
    new Set(selectedProtocols).size === new Set([...selectedProtocols, ...DEFAULT_PROTOCOL_OPTIONS]).size &&
    (isV4HooksToggleFFEnabled ? isV4HookPoolsEnabled : true)
  )
}
