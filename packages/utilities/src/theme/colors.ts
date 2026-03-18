const RBG_REGEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i

export function hexToRGB(hexString: string): { r: number; g: number; b: number } | null {
  const result = RBG_REGEX.exec(hexString)

  if (!result || !result[1] || !result[2] || !result[3]) {
    return null
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

export function hexToRGBString(hexString: string): string {
  // If the string is already in rgb/rgba format, return it as-is
  if (hexString.startsWith('rgb')) {
    const split = hexString.split(',')
    if (split.length === 3) {
      return hexString
    }

    // remove the alpha value
    split.pop()

    return split.join(',')
  }

  const rgb = hexToRGB(hexString)

  if (!rgb) {
    return hexString
  }

  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
}
