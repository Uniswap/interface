import { UniverseChainId } from '@universe/chains'

const V2_MIGRATION_UNSUPPORTED_CHAINS: ReadonlySet<number> = new Set([
  UniverseChainId.Arc,
  UniverseChainId.Ink,
  UniverseChainId.Robinhood,
])

export function isV2MigrationUnsupportedChain(chainId?: number): boolean {
  if (!chainId) {
    return false
  }
  return V2_MIGRATION_UNSUPPORTED_CHAINS.has(chainId)
}
