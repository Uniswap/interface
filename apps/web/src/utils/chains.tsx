import { CHAIN_IDS_TO_NAMES } from 'constants/chains'
import { ParsedQs } from 'qs'

function getChainIdFromName(name: string) {
  const entry = Object.entries(CHAIN_IDS_TO_NAMES).find(([, n]) => n === name)
  const chainId = entry?.[0]
  return chainId ? parseInt(chainId) : undefined
}

export function getParsedChainId(parsedQs?: ParsedQs) {
  const chain = parsedQs?.chain
  if (!chain || typeof chain !== 'string') {
    return
  }

  return getChainIdFromName(chain)
}
