import { CHAIN_IDS_TO_NAMES, CHAIN_INFO, SupportedInterfaceChainId, SupportedL2ChainId } from 'constants/chains'
import { ParsedQs } from 'qs'
import { NetworkLayer } from 'uniswap/src/types/chains'

export function isL2ChainId(chainId: SupportedInterfaceChainId): chainId is SupportedL2ChainId {
  const chainInfo = CHAIN_INFO[chainId]
  return chainInfo.networkLayer === NetworkLayer.L2
}

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
