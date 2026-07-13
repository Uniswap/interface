export function getLogolessColorIndex(tokenName: string, numOptions: number): number {
  const charCodes = Array.from(tokenName).map((char) => char.charCodeAt(0))
  const sum = charCodes.reduce((acc, curr) => acc + curr, 0)
  return sum % numOptions
}
