import { CHAIN_IDS_TO_NAMES } from 'constants/chains'
import { ParsedQs } from 'qs'

function getChainIdFromName(name: string) {
  const entry = Object.entries(CHAIN_IDS_TO_NAMES).find(([, n]) => n === name)
  const chainId = entry?.[0]
  return chainId ? parseInt(chainId) : undefined
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
