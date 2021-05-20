const SUPPORTED_CHAIN_IDS = [1, 3, 4, 5, 42]
/**
 * Returns the input chain ID if chain is supported. If not, return undefined
 * @param chainId a chain ID, which will be returned if it is a supported chain ID
 */
export function supportedChainId(chainId: number): number | undefined {
  if (SUPPORTED_CHAIN_IDS.includes(chainId)) {
    return chainId
  }
  return undefined
}
