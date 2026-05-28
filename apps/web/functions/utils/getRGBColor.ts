import JPEG from 'jpeg-js'
import PNG from 'png-ts'
import { parseToRgb } from 'polished'
import { RgbaColor, RgbColor } from 'polished/lib/types/color'
import { SPECIAL_CASE_TOKEN_COLORS } from 'ui/src/utils/colors/specialCaseTokens'

const DEFAULT_COLOR = { red: 35, green: 43, blue: 43 }

export async function getRGBColor(imageUrl: string | undefined, checkDistance = false): Promise<RgbColor | RgbaColor> {
  if (!imageUrl) {
    return DEFAULT_COLOR
  }
  if (imageUrl in SPECIAL_CASE_TOKEN_COLORS) {
    return parseToRgb(SPECIAL_CASE_TOKEN_COLORS[imageUrl])
  }
  try {
    const data = await fetch(imageUrl)
    const buffer = Buffer.from(await data.arrayBuffer())

    const type = data.headers.get('content-type') ?? ''
    return getAverageColor({ arrayBuffer: buffer, type, checkDistance })
  } catch {
    return DEFAULT_COLOR
  }
}

function getAverageColor({
  arrayBuffer,
  type,
  checkDistance,
}: {
  arrayBuffer: Uint8Array
  type: string
  checkDistance?: boolean
}) {
  let pixels
  switch (type) {
    case 'image/png': {
      const image = PNG.load(arrayBuffer)
      pixels = image.decode()
      break
    }
    case 'image/jpeg':
    case 'image/jpg': {
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

  let red = 0
  let green = 0
  let blue = 0

  for (let i = 0; i < pixelCount; i++) {
    if (pixels[i * 4 + 3] === 0) {
      transparentPixels++
      continue
    }
    red += pixels[i * 4]
    green += pixels[i * 4 + 1]
    blue += pixels[i * 4 + 2]
  }

  red = Math.floor(red / (pixelCount - transparentPixels))
  green = Math.floor(green / (pixelCount - transparentPixels))
  blue = Math.floor(blue / (pixelCount - transparentPixels))

  if (checkDistance) {
    const distance = Math.sqrt(Math.pow(red - 255, 2) + Math.pow(green - 255, 2) + Math.pow(blue - 255, 2))

    if (distance < 50) {
      return DEFAULT_COLOR
    }
  }

  return { red, green, blue }
}
