import { wordlists } from 'ethers'

export type Bounds = [minX: number, minY: number, maxX: number, maxY: number]

export interface OcrObject {
  bounds: Bounds
  height: number
  width: number
  text: string
}

export function extractSeedPhraseFromOCR(scan: OcrObject[], bounds: Bounds) {
  const words = scan.flatMap((obj) => {
    if (
      obj.bounds[0] > bounds[0] &&
      obj.bounds[1] > bounds[1] &&
      obj.bounds[2] < bounds[2] &&
      obj.bounds[3] < bounds[3]
    ) {
      return obj.text.split(' ').filter((word) => wordlists.en.getWordIndex(word) !== -1)
    }
    return []
  })
  // Must have at least 12 words, but if there are
  // too many it is likely the user is still zooming in
  if (words.length > 11 && words.length < 16) {
    return words
  }
  return null
}
