import { ChainId, TESTNET_CHAIN_IDS } from 'src/constants/chains'

const supportedChains = Object.values(ChainId).map((c) => c.toString())

// Some code from the web app uses chainId types as numbers
// This validates them as coerces into SupportedChainId
export function toSupportedChainId(chainId: number | string) {
  if (!supportedChains.includes(chainId.toString())) {
    return null
  }
  return parseInt(chainId.toString(), 10) as ChainId
}

// variant on `toSupportedChain` with a narrower return type
export function parseActiveChains(activeChainsString: string): ChainId[] {
  return activeChainsString.split(',').map((id) => parseInt(id, 10) as ChainId)
}

export function isTestnet(chainId: ChainId): boolean {
  return TESTNET_CHAIN_IDS.includes(chainId)
}
