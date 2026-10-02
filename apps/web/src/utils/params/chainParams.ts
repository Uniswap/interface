import { UniverseChainId } from '@universe/chains'
import { ParsedQs } from 'qs'
import { useParams } from 'react-router'
// oxlint-disable-next-line no-restricted-imports -- Need direct chain info access for network parameters
import { getChainInfo, UNIVERSE_CHAIN_INFO } from 'uniswap/src/features/chains/chainInfo'
import { GqlChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'

type ChainInfo = (typeof UNIVERSE_CHAIN_INFO)[keyof typeof UNIVERSE_CHAIN_INFO]

function getChainIdFromParam(value: string, matchesName: (chain: ChainInfo) => boolean): UniverseChainId | undefined {
  return Object.values(UNIVERSE_CHAIN_INFO).find((chain) => matchesName(chain) || String(chain.id) === value)?.id
}

// i.e. ?chain=mainnet -> ethereum
export function searchParamToBackendName(interfaceName: string | null): string | undefined {
  if (interfaceName === null) {
    return undefined
  }

  const chain = Object.values(UNIVERSE_CHAIN_INFO).find((item) => item.interfaceName === interfaceName)
  return chain ? chain.urlParam : undefined
}

export function isChainUrlParam(str: string): boolean {
  return !!str && getChainIdFromChainUrlParam(str) !== undefined
}

export function getChainIdFromChainUrlParam(chainUrlParam?: string): UniverseChainId | undefined {
  return chainUrlParam !== undefined
    ? getChainIdFromParam(chainUrlParam, (chain) => chainUrlParam === chain.urlParam)
    : undefined
}

export function getChainIdFromBackendChain(backendChain: GqlChainId): UniverseChainId | undefined {
  return Object.values(UNIVERSE_CHAIN_INFO).find((chain) => backendChain === chain.backendChain.chain)?.id
}

export function getChainUrlParam(chainId: UniverseChainId) {
  return getChainInfo(chainId).urlParam
}

export function useChainIdFromUrlParam(): UniverseChainId | undefined {
  const chainName = useParams<{ chainName?: string }>().chainName
  // In the case where /explore/:chainName is used, the chainName is passed as a tab param
  const tab = useParams<{ tab?: string }>().tab
  const chainId = getChainIdFromChainUrlParam(chainName ?? tab)
  return chainId
}

export function getParsedChainId(
  parsedQs?: ParsedQs,
  key: CurrencyField = CurrencyField.INPUT,
): UniverseChainId | undefined {
  const chain = key === CurrencyField.INPUT ? parsedQs?.chain : parsedQs?.outputChain
  if (!chain || typeof chain !== 'string') {
    return undefined
  }

  return getChainIdFromParam(chain, (chainInfo) => chainInfo.interfaceName === chain)
}
