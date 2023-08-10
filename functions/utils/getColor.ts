import { Buffer } from 'buffer'
import JPEG from 'jpeg-js'
import PNG from 'png-ts'

import { DEFAULT_COLOR } from '../constants'

export default async function getColor(image: string | undefined) {
  if (!image) {
    return DEFAULT_COLOR
  }
  try {
    const data = await fetch(image)
    const buffer = await data.arrayBuffer()
    const arrayBuffer = Buffer.from(buffer)

    const type = data.headers.get('content-type') ?? ''
    return getAverageColor(arrayBuffer, type)
  } catch (e) {
    return DEFAULT_COLOR
  }
}

function getAverageColor(arrayBuffer: Uint8Array, type?: string) {
  let pixels
  switch (type) {
    case 'image/png': {
      const image = PNG.load(arrayBuffer)
      pixels = image.decode()
      break
    }
    case 'image/jpeg' || 'image/jpg': {
      const jpeg = JPEG.decode(arrayBuffer, { useTArray: true })
      pixels = jpeg.data
      break
    }
    default: {
      return DEFAULT_COLOR
    }
  }

  const pixelCount = pixels.length / 4

  let transparentPixels = 0

  let r = 0
  let g = 0
  let b = 0

  for (let i = 0; i < pixelCount; i++) {
    if (pixels[i * 4 + 3] === 0) {
      transparentPixels++
      continue
    }
    r += pixels[i * 4]
    g += pixels[i * 4 + 1]
    b += pixels[i * 4 + 2]
  }

  r = Math.floor(r / (pixelCount - transparentPixels))
  g = Math.floor(g / (pixelCount - transparentPixels))
  b = Math.floor(b / (pixelCount - transparentPixels))

  return [r, g, b]
}
