import { ParsedQs } from 'qs'
import { useParams } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/features/chains/chainInfo'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'

// i.e. ?chain=mainnet -> ethereum
export function searchParamToBackendName(interfaceName: string | null): string | undefined {
  if (interfaceName === null) {
    return undefined
  }

  const chain = Object.values(UNIVERSE_CHAIN_INFO).find((item) => item.interfaceName === interfaceName)
  return chain ? chain.urlParam : undefined
}

export function isChainUrlParam(str: string): boolean {
  return !!str && Object.values(UNIVERSE_CHAIN_INFO).some((chain) => chain.urlParam === str)
}

export function getChainIdFromChainUrlParam(chainUrlParam?: string): UniverseChainId | undefined {
  return chainUrlParam !== undefined
    ? Object.values(UNIVERSE_CHAIN_INFO).find((chain) => chainUrlParam === chain.urlParam)?.id
    : undefined
}

export function useChainIdFromUrlParam(): UniverseChainId | undefined {
  const chainName = useParams<{ chainName?: string }>().chainName
  // In the case where /explore/:chainName is used, the chainName is passed as a tab param
  const tab = useParams<{ tab?: string }>().tab
  const chainId = getChainIdFromChainUrlParam(chainName ?? tab)
  const supportedChainId = useSupportedChainId(chainId)
  return supportedChainId
}

export function getParsedChainId(
  parsedQs?: ParsedQs,
  key: CurrencyField = CurrencyField.INPUT,
): UniverseChainId | undefined {
  const chain = key === CurrencyField.INPUT ? parsedQs?.chain : parsedQs?.outputChain
  if (!chain || typeof chain !== 'string') {
    return undefined
  }

  const chainInfo = Object.values(UNIVERSE_CHAIN_INFO).find((i) => i.interfaceName === chain)
  return chainInfo?.id
}
