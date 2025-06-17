import { ColorTokens } from 'tamagui'
import { logger } from 'utilities/src/logger/logger'

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/

/**
 * Adds opacity to the input color. Same as opacifyRaw but returns a ColorTokens object.
 *
 * @param opacity Opacity value to apply from 0-100
 * @param color Hex or RGB to apply the opacity to.
 * @returns
 */
export function opacify(opacity: number, color: string): ColorTokens {
  return opacifyRaw(opacity, color) as ColorTokens
}

/**
 * Adds opacity to the input color and returns a string. RGBA is intentionally not supported.
 *
 * @param opacity Opacity value to apply from 0-100
 * @param color Hex or RGB to apply the opacity to.
 * @returns
 */
export function opacifyRaw(opacity: number, color: string): string {
  'worklet'
  try {
    if (opacity < 0 || opacity > 100) {
      throw new Error(`provided opacity ${opacity} should be between 0 and 100`)
    }

    if (color.startsWith('#')) {
      return _opacifyHex(opacity, color)
    }
    if (color.startsWith('rgb(')) {
      return _opacifyRgba(opacity, color)
    }
    throw new Error(`provided color ${color} is neither a hex nor an rgb color`)
  } catch (e) {
    logger.warn('color/utils', 'opacifyRaw', `Error opacifying color ${color} with opacity ${opacity}: ${e}`)
  }
  return color
}

function _opacifyRgba(opacity: number, color: string): string {
  const match = color.match(/rgba?\(([^)]+)\)/)
  if (!match) {
    throw new Error(`provided color ${color} is invalid rgb format`)
  }
  const parts = match[1]?.split(',').map((p) => p.trim())

  if (!parts || parts.length < 3) {
    throw new Error(`provided color ${color} does not have enough components`)
  }

  const [r, g, b] = parts
  return `rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)})`
}

function _opacifyHex(opacity: number, color: string): string {
  if (![5, 7, 9].includes(color.length)) {
    throw new Error(`provided color ${color} was not in hexadecimal format (e.g. #000000)`)
  }

  let hex = color
  if (color.length === 5) {
    hex = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
  }

  const validHexColor = HEX_REGEX.test(hex)
  if (!validHexColor) {
    throw new Error(`provided color ${color} contains invalid characters, should be a valid hex (e.g. #000000)`)
  }
  const opacityHex = Math.round((opacity / 100) * 255).toString(16)
  const opacifySuffix = opacityHex.length < 2 ? `0${opacityHex}` : opacityHex

  return `${hex.slice(0, 7)}${opacifySuffix}`
}
