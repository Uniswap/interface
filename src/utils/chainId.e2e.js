import { ChainId } from 'src/constants/chains'

export function toSupportedChain(chainId) {
  return parseInt(chainId.toString(), 10)
}

export function parseActiveChains() {
  return [ChainId.MAINNET]
}
