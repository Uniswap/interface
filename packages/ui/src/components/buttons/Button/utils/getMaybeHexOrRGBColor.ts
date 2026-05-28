import { OpaqueColorValue } from 'react-native'
import { GetThemeValueForKey } from 'tamagui'

type HexColor = `#${string}${string}${string}` | `#${string}${string}${string}${string}${string}${string}`
type RgbColor = `rgb(${number}, ${number}, ${number})` | `rgba(${number}, ${number}, ${number}, ${number})`

type HexOrRgbColor = HexColor | RgbColor

export const getMaybeHexOrRGBColor = (
  color?: string | GetThemeValueForKey<'backgroundColor'> | OpaqueColorValue,
): HexOrRgbColor | undefined => {
  if (!color) {
    return undefined
  }

  if (typeof color !== 'string') {
    return undefined
  }

  if (color.charAt(0) === '#' && (color.length === 7 || color.length === 9 || color.length === 4)) {
    return color as HexOrRgbColor
  }

  if (color.charAt(0) === 'r' && color.charAt(1) === 'g' && color.charAt(2) === 'b') {
    return color as HexOrRgbColor
  }

  return undefined
}
