// change this if we change the fallback provider
export const fallbackProvider = 'PopRank'
export const shouldLinkToFallbackProvider = false
export const fallbackProviderLogo = '/nft/logos/poprank.png'

/**
 * Add provider mappings based on provider name returned from the backend here
 */
export const rarityProviderLogo: { [key: string]: string } = {
  'Rarity Sniper': '/nft/svgs/gem.svg',
  Genie: fallbackProviderLogo,
}

export const getRarityProviderLogo = (source?: string): string | undefined => {
  if (!source) return undefined
  return rarityProviderLogo[source] || fallbackProviderLogo
}
