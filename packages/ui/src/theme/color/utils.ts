import { ColorTokens } from 'tamagui'

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/

export function opacify(amount: number, hexColor: string): ColorTokens {
  return opacifyRaw(amount, hexColor) as ColorTokens
}

export function opacifyRaw(amount: number, hexColor: string): string {
  'worklet'
  if (!hexColor.startsWith('#')) {
    return hexColor
  }

  if (hexColor.length !== 7 && hexColor.length !== 9 && hexColor.length !== 4) {
    throw new Error(`opacify: provided color ${hexColor} was not in hexadecimal format (e.g. #000000)`)
  }

  if (amount < 0 || amount > 100) {
    throw new Error('opacify: provided amount should be between 0 and 100')
  }

  const validHexColor = HEX_REGEX.test(hexColor)
  if (!validHexColor) {
    throw new Error(
      `opacify: provided color ${hexColor} contains invalid characters, should be a valid hex (e.g. #000000)`,
    )
  }
  const opacityHex = Math.round((amount / 100) * 255).toString(16)
  const opacifySuffix = opacityHex.length < 2 ? `0${opacityHex}` : opacityHex

  return `${hexColor.slice(0, 7)}${opacifySuffix}`
}
