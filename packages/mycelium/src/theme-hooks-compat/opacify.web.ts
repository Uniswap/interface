/**
 * Web leg of the `opacify` compat (`ui/src/theme/color/utils`): identical
 * output strings, including the invalid-input path (the reference warns and
 * returns the input unchanged — it never throws). The reference's
 * `logger.warn` on invalid input is intentionally dropped: mycelium takes no
 * `utilities` dependency, and the return-value contract is unchanged.
 */
const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/

/**
 * Adds opacity to the input color.
 *
 * @param opacity Opacity value to apply from 0-100
 * @param color Hex or RGB to apply the opacity to. RGBA is intentionally not supported.
 */
export function opacify(opacity: number, color: string): string {
  try {
    if (opacity < 0 || opacity > 100) {
      throw new Error(`provided opacity ${opacity} should be between 0 and 100`)
    }

    if (color.startsWith('#')) {
      return opacifyHex(opacity, color)
    }
    if (color.startsWith('rgb(')) {
      return opacifyRgba(opacity, color)
    }
    throw new Error(`provided color ${color} is neither a hex nor an rgb color`)
  } catch {
    return color
  }
}

/** Same output as `opacify`; the reference exposes both names. */
export const opacifyRaw = opacify

function opacifyRgba(opacity: number, color: string): string {
  const match = /rgba?\(([^)]+)\)/.exec(color)
  if (!match) {
    throw new Error(`provided color ${color} is invalid rgb format`)
  }
  const parts = match[1]?.split(',').map((part) => part.trim())

  if (!parts || parts.length < 3) {
    throw new Error(`provided color ${color} does not have enough components`)
  }

  const [r, g, b] = parts
  return `rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)})`
}

function opacifyHex(opacity: number, color: string): string {
  if (![5, 7, 9].includes(color.length)) {
    throw new Error(`provided color ${color} was not in hexadecimal format (e.g. #000000)`)
  }

  let hex = color
  if (color.length === 5) {
    hex = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
  }

  if (!HEX_REGEX.test(hex)) {
    throw new Error(`provided color ${color} contains invalid characters, should be a valid hex (e.g. #000000)`)
  }
  const opacityHex = Math.round((opacity / 100) * 255).toString(16)
  const opacifySuffix = opacityHex.length < 2 ? `0${opacityHex}` : opacityHex

  return `${hex.slice(0, 7)}${opacifySuffix}`
}
