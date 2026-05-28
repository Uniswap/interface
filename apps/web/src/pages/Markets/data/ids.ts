const MORPHO_MARKET_ID_PREFIX = 'morpho-market'
const MORPHO_VAULT_ID_PREFIX = 'morpho-vault'

export function createMorphoMarketEntityId(chainId: number, uniqueKey: string): string {
  return `${MORPHO_MARKET_ID_PREFIX}-${chainId}-${uniqueKey.toLowerCase()}`
}

export function createMorphoVaultEntityId(chainId: number, address: string): string {
  return `${MORPHO_VAULT_ID_PREFIX}-${chainId}-${address.toLowerCase()}`
}

export function parseMorphoMarketEntityId(entityId?: string): { chainId: number; uniqueKey: `0x${string}` } | null {
  const prefix = `${MORPHO_MARKET_ID_PREFIX}-`
  if (!entityId?.startsWith(prefix)) {
    return null
  }

  const remainder = entityId.slice(prefix.length)
  const separatorIndex = remainder.indexOf('-')
  if (separatorIndex <= 0) {
    return null
  }

  const chainId = Number(remainder.slice(0, separatorIndex))
  const uniqueKey = remainder.slice(separatorIndex + 1)
  if (!Number.isInteger(chainId) || !uniqueKey.startsWith('0x')) {
    return null
  }

  return { chainId, uniqueKey: uniqueKey as `0x${string}` }
}

export function parseMorphoVaultEntityId(entityId?: string): { chainId: number; address: `0x${string}` } | null {
  const prefix = `${MORPHO_VAULT_ID_PREFIX}-`
  if (!entityId?.startsWith(prefix)) {
    return null
  }

  const remainder = entityId.slice(prefix.length)
  const separatorIndex = remainder.indexOf('-')
  if (separatorIndex <= 0) {
    return null
  }

  const chainId = Number(remainder.slice(0, separatorIndex))
  const address = remainder.slice(separatorIndex + 1)
  if (!Number.isInteger(chainId) || !address.startsWith('0x')) {
    return null
  }

  return { chainId, address: address as `0x${string}` }
}
