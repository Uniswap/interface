import { CHAIN_IDS_TO_NAMES } from 'constants/chains'
import { ParsedQs } from 'qs'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'

function getChainIdFromName(name: string) {
  const entry = Object.entries(CHAIN_IDS_TO_NAMES).find(([, n]) => n === name)
  const chainId = entry?.[0]
  return chainId ? parseInt(chainId) : undefined
}

// i.e. ?chain=mainnet -> ethereum
export function searchParamToBackendName(interfaceName: string | null): string | undefined {
  if (interfaceName === null) {
    return undefined
  }

  const chain = Object.values(UNIVERSE_CHAIN_INFO).find((item) => item.interfaceName === interfaceName)
  return chain ? chain.urlParam : undefined
}

export enum ParsedChainIdKey {
  INPUT = 'input',
  OUTPUT = 'output',
}

export function getParsedChainId(parsedQs?: ParsedQs, key: ParsedChainIdKey = ParsedChainIdKey.INPUT) {
  const chain = key === ParsedChainIdKey.INPUT ? parsedQs?.chain : parsedQs?.outputChain
  if (!chain || typeof chain !== 'string') {
    return undefined
  }

  return getChainIdFromName(chain)
}
