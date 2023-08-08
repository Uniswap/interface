import ColorThief from 'colorthief/src/color-thief-node'

export default async function getColor(image: string) {
  try {
    const data = await fetch(image)
      .then((res) => res.arrayBuffer())
      .then((arrayBuffer) => Buffer.from(arrayBuffer))
    const palette = await ColorThief.getPalette(data, 5)
    return palette[0] ?? [35, 43, 43]
  } catch (e) {
    return [35, 43, 43]
  }
}
