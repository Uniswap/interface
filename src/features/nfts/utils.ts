export const getNFTAssetKey = (address: Address, token_id?: string): string =>
  `nftItem.${address}.${token_id}`
