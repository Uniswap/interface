import { ChainId } from 'src/constants/chains'

export function toSupportedChainId(chainId) {
  return parseInt(chainId.toString(), 10)
}

export function parseActiveChains() {
  return [ChainId.Mainnet]
}

export function isTestnet() {
  // prevents network request to covalent
  return true
}
