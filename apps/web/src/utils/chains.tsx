import { CHAIN_IDS_TO_NAMES, SupportedInterfaceChainId } from 'constants/chains'
import { ParsedQs } from 'qs'
import { L2ChainId, UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { NetworkLayer } from 'uniswap/src/types/chains'

export function isL2ChainId(chainId: SupportedInterfaceChainId): chainId is L2ChainId {
  const chainInfo = UNIVERSE_CHAIN_INFO[chainId]
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
