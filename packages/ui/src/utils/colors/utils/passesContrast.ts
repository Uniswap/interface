import { hex } from 'wcag-contrast'

export function passesContrast({
  color,
  backgroundColor,
  contrastThreshold,
}: {
  color: string
  backgroundColor: string
  contrastThreshold: number
}): boolean {
  // sometimes the extracted colors come back as black or white, discard those
  if (!color || color === '#000000' || color === '#FFFFFF') {
    return false
  }

  const contrast = hex(color, backgroundColor)
  return contrast >= contrastThreshold
}
