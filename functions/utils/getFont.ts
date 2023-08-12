const FONT_URL = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZFhjQ.ttf'

export default async function getFont() {
  const font = await fetch(FONT_URL)
  return font.arrayBuffer()
}
