import { isAddress } from 'ethers/lib/utils'
import { svgPaths as containerPaths } from 'src/components/unicons/Container'
import { svgPaths as emblemPaths } from 'src/components/unicons/Emblem'
import {
  gradientEnds,
  gradientStarts,
  UniconAttributeData,
  UniconAttributes,
  UniconAttributesArray,
  UniconAttributesToIndices,
  UniconNumOptions,
} from 'src/components/unicons/types'

const NUM_CHARS_TO_USE_PER_ATTRIBUTE = 2

export const isEthAddress = (address: string) => {
  return address.startsWith('0x') && isAddress(address.toLowerCase())
}

export const deriveUniconAttributeIndices = (
  address: string,
  randomSeed: number = 0
): UniconAttributesToIndices | undefined => {
  if (!isEthAddress(address)) return

  const hexAddr = address.slice(-40)
  const newIndices = {
    [UniconAttributes.GradientStart]: 0,
    [UniconAttributes.GradientEnd]: 0,
    [UniconAttributes.Container]: 0,
    [UniconAttributes.Shape]: 0,
  } as UniconAttributesToIndices
  for (let a of UniconAttributesArray) {
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
    [UniconAttributes.Container]: containerPaths[attributeIndices[UniconAttributes.Container]],
    [UniconAttributes.Shape]: emblemPaths[attributeIndices[UniconAttributes.Shape]],
  } as UniconAttributeData
}
