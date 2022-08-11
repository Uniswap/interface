export const foregrounds = ['#001FAA', '#5D31FF', '#8EC3E4', '#F10B00', '#E843D3', '#C4B5FC', '#F88DD5']

export const backgrounds = ['#5DCCB9', '#9AFBCF', '#D1F8E7', '#73F54B', '#D3FB51', '#FCF958']

export function hashCode(text: string) {
  let hash = 0
  if (text.length === 0) return hash
  for (let i = 0; i < text.length; i++) {
    const chr = text.charCodeAt(i)
    hash = (hash << 3) - hash + chr
    hash |= 0
  }
  return hash
}

export function addressToHashedColor(colors: string[], address: string | null): string | undefined {
  if (address == null) return undefined

  return colors[Math.abs(hashCode(address.toLowerCase()) % colors.length)]
}
