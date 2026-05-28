import {
  DEFAULT_PROTOCOL_OPTIONS,
  type FrontendSupportedProtocol,
} from 'uniswap/src/features/transactions/swap/utils/protocols'

export function isDefaultTradeRouteOptions({
  selectedProtocols,
  isV4HookPoolsEnabled,
}: {
  selectedProtocols: FrontendSupportedProtocol[]
  isV4HookPoolsEnabled: boolean
}): boolean {
  return (
    new Set(selectedProtocols).size === new Set([...selectedProtocols, ...DEFAULT_PROTOCOL_OPTIONS]).size &&
    isV4HookPoolsEnabled
  )
}
