import { isAddress } from 'ethers/lib/utils'

import { containerSvgPaths } from './Container.web'
import { emblemSvgPaths } from './Emblem.web'
import {
  blurs,
  gradientEnds,
  gradientStarts,
  UniconAttributeData,
  UniconAttributes,
  UniconAttributesArray,
  UniconAttributesToIndices,
  UniconNumOptions,
} from './types.web'

const NUM_CHARS_TO_USE_PER_ATTRIBUTE = 2

export const isEthAddress = (address: string): boolean => {
  return address.startsWith('0x') && isAddress(address.toLowerCase())
}

export const deriveUniconAttributeIndices = (
  address: string,
  randomSeed = 0
): UniconAttributesToIndices | undefined => {
  if (!isEthAddress(address)) {
    return
  }

  const hexAddr = address.slice(-40)
  const newIndices = {
    [UniconAttributes.GradientStart]: 0,
    [UniconAttributes.GradientEnd]: 0,
    [UniconAttributes.Container]: 0,
    [UniconAttributes.Shape]: 0,
  } as UniconAttributesToIndices
  for (const a of UniconAttributesArray) {
    const optionHex = hexAddr.slice(
      NUM_CHARS_TO_USE_PER_ATTRIBUTE * a,
      NUM_CHARS_TO_USE_PER_ATTRIBUTE * (a + 1)
    )
    const optionDec = parseInt(optionHex, 16) + randomSeed
    const optionIndex = optionDec % UniconNumOptions[a]
    newIndices[a] = optionIndex
  }
  return newIndices
}

export const getUniconAttributeData = (
  attributeIndices: UniconAttributesToIndices
): UniconAttributeData => {
  return {
    [UniconAttributes.GradientStart]:
      gradientStarts[attributeIndices[UniconAttributes.GradientStart]],
    [UniconAttributes.GradientEnd]: gradientEnds[attributeIndices[UniconAttributes.GradientEnd]],
    [UniconAttributes.Container]: containerSvgPaths[attributeIndices[UniconAttributes.Container]],
    [UniconAttributes.Shape]: emblemSvgPaths[attributeIndices[UniconAttributes.Shape]],
  } as UniconAttributeData
}

export const useUniconColors = (
  activeAddress: string | undefined
): {
  glow: string
  gradientStart: string
  gradientEnd: string
} => {
  const attributeIndices = deriveUniconAttributeIndices(activeAddress || '')
  if (!attributeIndices) {
    return {
      gradientStart: '$accent1',
      gradientEnd: '$accent2',
      glow: '$accent1',
    }
  }

  const attributeData = getUniconAttributeData(attributeIndices)
  const blurColor = blurs[attributeIndices[UniconAttributes.GradientStart]]
  if (!blurColor) {
    return {
      gradientStart: '$accent1',
      gradientEnd: '$accent2',
      glow: '$accent1',
    }
  }

  return {
    gradientStart: attributeData[UniconAttributes.GradientStart].toString(),
    gradientEnd: attributeData[UniconAttributes.GradientEnd].toString(),
    glow: blurColor.toString(),
  }
}

// Adapted from https://natclark.com/tutorials/javascript-lighten-darken-hex-color/
export function adjustColor(hexColor: string, magnitude: number): string {
  hexColor = hexColor.replace(`#`, ``)
  if (hexColor.length === 6) {
    const decimalColor = parseInt(hexColor, 16)
    // eslint-disable-next-line no-bitwise
    let r = (decimalColor >> 16) + magnitude
    r > 255 && (r = 255)
    r < 0 && (r = 0)
    // eslint-disable-next-line no-bitwise
    let g = (decimalColor & 0x0000ff) + magnitude
    g > 255 && (g = 255)
    g < 0 && (g = 0)
    // eslint-disable-next-line no-bitwise
    let b = ((decimalColor >> 8) & 0x00ff) + magnitude
    b > 255 && (b = 255)
    b < 0 && (b = 0)
    // eslint-disable-next-line no-bitwise
    return `#${(g | (b << 8) | (r << 16)).toString(16)}`
  } else {
    return hexColor
  }
}
