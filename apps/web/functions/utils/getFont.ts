export default async function getFont(origin: string) {
  const url = origin + '/fonts/Inter-normal.var.ttf'
  const font = await fetch(url)
  return font.arrayBuffer()
}
