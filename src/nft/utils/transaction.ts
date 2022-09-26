// Shortens a given txHash. With standard charsToShorten var of 4, a hash will become 0x1234...1234
export const shortenTxHash = (txHash: string, charsToShorten = 4, addCharsToBack = 0): string => {
  return `${txHash.substring(0, charsToShorten + 2)}...${txHash.substring(
    txHash.length - charsToShorten,
    txHash.length - (charsToShorten + addCharsToBack)
  )}`
}
