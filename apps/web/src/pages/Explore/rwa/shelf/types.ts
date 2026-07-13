/** Optional because only the Explore shelf logs card clicks; the reused TDP RelatedTokens shelf omits it. */
export type AssetCardClickHandler = (args: { tokenAddress: string; tokenSymbol: string }) => void
