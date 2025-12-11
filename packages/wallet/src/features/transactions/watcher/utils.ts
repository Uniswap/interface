import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'

/**
 * Checks if the toAddress is in the acrossProtocolAddresses for the given chainId.
 * Used for DAPP requests to detect if a transaction is a bridge transaction since
 * limited data is available in the DAPP request.
 *
 * This is MAYBE a bridge TX since it's not guaranteed that the toAddress is the
 * matches the acrossProtocolAddress for the given chainId.
 *
 * TODO (APP-8906): Improve isMaybeBridge to become isBridge.
 **/
export function isMaybeBridge(toAddress?: string, chainId?: number): boolean {
  if (!toAddress || !chainId) {
    return false
  }
  const chainInfo = getChainInfo(chainId)
  return chainInfo.acrossProtocolAddress?.toLowerCase() === toAddress.toLowerCase()
}
