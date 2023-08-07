const watermark = 'https://app.uniswap.org/images/324x74_App_Watermark.png'
const check = 'https://app.uniswap.org/images/54x54_Verified_Check.svg'

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
