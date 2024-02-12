import { isAddress } from 'ethers/lib/utils'
import { useSporeColors } from 'ui/src/'
import { containerSvgPaths } from './Container.native'
import { emblemSvgPaths } from './Emblem.native'
import {
  blurs,
  gradientEnds,
  gradientStarts,
  UniconAttributeData,
  UniconAttributes,
  UniconAttributesArray,
  UniconAttributesToIndices,
  UniconNumOptions,
} from './types.native'

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
  const colors = useSporeColors()
  const attributeIndices = deriveUniconAttributeIndices(activeAddress || '')
  if (!attributeIndices) {
    return {
      gradientStart: colors.accent1.val,
      gradientEnd: colors.accent2.val,
      glow: colors.accent1.val,
    }
  }

  const attributeData = getUniconAttributeData(attributeIndices)
  const blurColor = blurs[attributeIndices[UniconAttributes.GradientStart]]
  if (!blurColor) {
    return {
      gradientStart: colors.accent1.val,
      gradientEnd: colors.accent2.val,
      glow: colors.accent1.val,
    }
  }

  return {
    gradientStart: attributeData[UniconAttributes.GradientStart].toString(),
    gradientEnd: attributeData[UniconAttributes.GradientEnd].toString(),
    glow: blurColor.toString(),
  }
}
