export function parseRgb888(color: string): { r: number; g: number; b: number } | null {
  if (color.startsWith('#')) {
    if (color.length < 7) {
      return null
    }

    return {
      r: parseInt(color.slice(1, 3), 16),
      g: parseInt(color.slice(3, 5), 16),
      b: parseInt(color.slice(5, 7), 16),
    }
  }

  if (color.startsWith('rgb')) {
    const rgbMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
    if (!rgbMatch?.[1] || !rgbMatch[2] || !rgbMatch[3]) {
      return null
    }

    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    }
  }

  return null
}
