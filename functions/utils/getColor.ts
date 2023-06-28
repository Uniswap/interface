import ColorThief from 'colorthief/src/color-thief-node'

export default async function getColor(image: string) {
  try {
    const data = await fetch(image)
      .then((res) => res.arrayBuffer())
      .then((arrayBuffer) => Buffer.from(arrayBuffer))
    const palette = ColorThief.getPalette(data)
    return palette[0]
  } catch (e) {
    return
  }
}
