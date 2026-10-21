import { opacify } from 'ui/src/theme'

// opacify() (ui/src) intentionally leaves rgba() colors unchanged (logs a warn); spore neutral
// tokens ARE rgba, so set their alpha channel locally. Matches opacify's absolute-set semantic
// (alpha := amount/100); hex/rgb inputs delegate to opacify.
export function withOpacity({ amount, color }: { amount: number; color: string }): string {
  const match = color.match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/)
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${amount / 100})`
  }
  return opacify(amount, color)
}
