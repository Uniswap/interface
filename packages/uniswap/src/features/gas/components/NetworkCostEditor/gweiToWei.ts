const GWEI_TO_WEI = BigInt('1000000000')

/**
 * Convert a decimal-GWEI string (may include commas as thousands separators)
 * to a decimal-wei string. Returns undefined on invalid input.
 */
export function gweiToWei(gwei?: string): string | undefined {
  if (!gwei) {
    return undefined
  }
  const cleaned = gwei.replace(/,/g, '')
  // oxlint-disable-next-line security/detect-unsafe-regex -- anchored, no quantifier overlap, ReDoS-safe
  if (!/^[0-9]+(\.[0-9]+)?$/.test(cleaned)) {
    return undefined
  }
  const [intPart, fracPartRaw = ''] = cleaned.split('.')
  if (intPart === undefined) {
    return undefined
  }
  const fracPart = (fracPartRaw + '000000000').slice(0, 9)
  return (BigInt(intPart) * GWEI_TO_WEI + BigInt(fracPart)).toString()
}

/**
 * Convert a decimal-wei value (BigInt or numeric string) to a decimal-GWEI
 * string, preserving sub-GWEI precision. Plain `wei / 1e9` BigInt division
 * truncates fractional GWEI to `0`, which is wrong for L2-ish base fees
 * under 1 GWEI.
 */
export function weiToGwei(wei: bigint | string): string {
  const big = typeof wei === 'bigint' ? wei : BigInt(wei)
  const intPart = big / GWEI_TO_WEI
  const fracPart = big % GWEI_TO_WEI
  if (fracPart === BigInt(0)) {
    return intPart.toString()
  }
  const fracStr = fracPart.toString().padStart(9, '0').replace(/0+$/, '')
  return `${intPart}.${fracStr}`
}

/**
 * Add two GWEI strings, returning a GWEI string.
 * Returns undefined if either is invalid.
 */
export function addGwei(a?: string, b?: string): string | undefined {
  if (!a && !b) {
    return undefined
  }
  if (!a) {
    return b
  }
  if (!b) {
    return a
  }
  const aWei = gweiToWei(a)
  const bWei = gweiToWei(b)
  if (!aWei || !bWei) {
    return undefined
  }
  return weiToGwei(BigInt(aWei) + BigInt(bWei))
}
