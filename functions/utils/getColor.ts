import ColorThief from 'colorthief/src/color-thief-node'

import { DEFAULT_COLOR } from '../constants'

export default async function getColor(image: string) {
  try {
    const data = await fetch(image)
    const buffer = await data.arrayBuffer()
    const arrayBuffer = Buffer.from(buffer)

    const palette = await ColorThief.getPalette(arrayBuffer, 5)
    return palette[0] ?? DEFAULT_COLOR
  } catch (e) {
    return DEFAULT_COLOR
  }
}
