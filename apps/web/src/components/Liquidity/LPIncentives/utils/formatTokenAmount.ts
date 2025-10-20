import { formatUnits } from 'viem'

export function formatTokenAmount(amount: string, decimals: number): string {
  try {
    const formatted = formatUnits(BigInt(amount), decimals)
    // Split by decimal point and truncate to 3 decimal places
    const [whole, decimal] = formatted.split('.')
    if (!decimal) {
      return whole
    }
    return `${whole}.${decimal.slice(0, 3)}`
  } catch (_e) {
    return '0'
  }
}
