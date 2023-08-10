import { Buffer } from 'buffer'
import PNG from 'png-ts'

import { DEFAULT_COLOR } from '../constants'

export default async function getColor(image: string) {
  try {
    const data = await fetch(image)
    const buffer = await data.arrayBuffer()
    const arrayBuffer = Buffer.from(buffer)

    return getAverageColor(arrayBuffer)
  } catch (e) {
    return DEFAULT_COLOR
  }
}

function getAverageColor(arrayBuffer: Uint8Array) {
  const image = PNG.load(arrayBuffer)
  const pixels = image.decodePixels()

  const pixelCount = pixels.length / 4

  let r = 0
  let g = 0
  let b = 0

  for (let i = 0; i < pixelCount; i++) {
    r += pixels[i * 4]
    g += pixels[i * 4 + 1]
    b += pixels[i * 4 + 2]
  }

  r = Math.floor(r / pixelCount)
  g = Math.floor(g / pixelCount)
  b = Math.floor(b / pixelCount)

  return [r, g, b]
}
