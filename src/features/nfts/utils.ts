export const getNFTAssetKey = (address: Address, token_id?: string) =>
  `nftItem.${address}.${token_id}`
