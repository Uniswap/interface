import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'

/**
 * Finds a matching chain ID based on the provided chain name.
 * This is intended to check if a singular word is a chain name. It doesn't
 * look for chain names in multi-word searches.
 *
 * @param maybeChainName - The potential chain name to match against
 * @param enabledChains - Array of enabled chain IDs to search within
 * @returns The matching UniverseChainId or undefined if no match found
 */
export function getPossibleChainMatchFromSearchWord(
  maybeChainName: string,
  enabledChains: UniverseChainId[],
): UniverseChainId | undefined {
  if (!maybeChainName) {
    return undefined
  }

  const lowerCaseChainName = maybeChainName.toLowerCase()

  for (const chainId of enabledChains) {
    if (isTestnetChain(chainId)) {
      continue
    }

    const chainInfo = getChainInfo(chainId)

    // Check against native currency name
    const nativeCurrencyName = chainInfo.nativeCurrency.name.toLowerCase()
    const firstWord = nativeCurrencyName.split(' ')[0]

    if (firstWord && firstWord === lowerCaseChainName) {
      return chainId
    }

    // Check against interface name
    const interfaceName = chainInfo.interfaceName.toLowerCase()
    if (interfaceName === lowerCaseChainName) {
      return chainId
    }
  }

  return undefined
}
