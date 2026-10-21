import { UniverseChainId } from '@universe/chains'

// Chain-name labels for bridge/step copy. Only the margin chain + curated bridge sources
// are reachable; chain proper nouns aren't translated (interpolated like token symbols).
export function marginChainName(chainId?: number): string {
  switch (chainId) {
    case UniverseChainId.Base:
      return 'Base'
    case UniverseChainId.ArbitrumOne:
      return 'Arbitrum'
    case UniverseChainId.Unichain:
      return 'Unichain'
    default:
      return 'Ethereum'
  }
}
