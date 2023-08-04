const watermark = (await import('../assets/watermark.svg')) as unknown as string
const check = (await import('../assets/verified.svg')) as unknown as string

export default async function getSetup() {
  const font = fetch(
    new Request('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZFhjQ.ttf')
  ).then((res) => res.arrayBuffer())
  const fontData = await font

  return {
    fontData,
    watermark,
    check,
  }
}
