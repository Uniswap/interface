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
  switch (type) {
    case 'image/png': {
      const image = PNG.load(arrayBuffer)
      const pixels = image.decode()

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
    case 'image/jpeg' || 'image/jpg': {
      const jpeg = JPEG.decode(arrayBuffer, { useTArray: true })
      const jpegPixels = jpeg.data

      const jpegPixelCount = jpegPixels.length / 4

      let jpegR = 0
      let jpegG = 0
      let jpegB = 0

      for (let i = 0; i < jpegPixelCount; i++) {
        jpegR += jpegPixels[i * 4]
        jpegG += jpegPixels[i * 4 + 1]
        jpegB += jpegPixels[i * 4 + 2]
      }

      jpegR = Math.floor(jpegR / jpegPixelCount)
      jpegG = Math.floor(jpegG / jpegPixelCount)
      jpegB = Math.floor(jpegB / jpegPixelCount)

      return [jpegR, jpegG, jpegB]
    }
    default: {
      return DEFAULT_COLOR
    }
  }
}
