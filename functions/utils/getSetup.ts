import check from '../assets/verified.svg'
import watermark from '../assets/watermark.svg'

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
