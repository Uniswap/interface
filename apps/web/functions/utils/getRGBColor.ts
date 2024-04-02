import { parseToRgb } from 'polished'
import { RgbColor, RgbaColor } from 'polished/lib/types/color'
import { getExtractedColors } from 'ui/src/utils/colors'

const DEFAULT_COLOR = { red: 35, green: 43, blue: 43 }

export async function getRGBColor(imageUrl?: string): Promise<RgbColor | RgbaColor> {
  if (!imageUrl) return DEFAULT_COLOR

  const colors = await getExtractedColors(imageUrl)
  const extractedColor = colors?.detail ?? colors?.primary

  return extractedColor ? parseToRgb(extractedColor) : DEFAULT_COLOR
}
