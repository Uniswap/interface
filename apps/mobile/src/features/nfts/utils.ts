export const getNFTAssetKey = (address: Address, token_id: string): string => {
  // Backend returns both checksummed and non-checksummed addresses
  // so we need to lowercase it to be able to compare them
  return `nftItem.${address.toLowerCase()}.${token_id}`
}
