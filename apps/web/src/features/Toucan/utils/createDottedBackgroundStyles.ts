import { CSSProperties } from 'react'
import { opacifyRaw } from 'ui/src/theme'

const DOT_SIZE_PX = 1
const DOT_GRID_SIZE_PX = 10

interface DottedBackgroundOptions {
  /** The color for the dots (will be opacified) */
  dotColor: string
  /** Opacity value from 0-100 for the dots */
  dotOpacity: number
  /** Optional radial gradient overlay opacity values [center, mid, edge] */
  gradientOpacities?: {
    center: number
    mid: number
  }
}

interface DottedBackgroundStyles {
  dottedBackgroundStyle: CSSProperties
  radialGradientStyle: CSSProperties | undefined
}

/**
 * Creates dotted background and radial gradient overlay styles
 * Used by AuctionChip and AuctionIntroBanner for consistent theming
 */
export function createDottedBackgroundStyles(options: DottedBackgroundOptions): DottedBackgroundStyles {
  const { dotColor, dotOpacity, gradientOpacities } = options

  const dots = opacifyRaw(dotOpacity, dotColor)
  const dottedBackgroundStyle: CSSProperties = {
    backgroundImage: `radial-gradient(circle at ${DOT_SIZE_PX}px ${DOT_SIZE_PX}px, ${dots} ${DOT_SIZE_PX}px, transparent 0)`,
    backgroundSize: `${DOT_GRID_SIZE_PX}px ${DOT_GRID_SIZE_PX}px`,
  }

  let radialGradientStyle: CSSProperties | undefined
  if (gradientOpacities) {
    radialGradientStyle = {
      background: `radial-gradient(ellipse 60% 400% at 50% 50%, ${opacifyRaw(gradientOpacities.center, dotColor)} 0%, ${opacifyRaw(gradientOpacities.mid, dotColor)} 40%, transparent 90%)`,
    }
  }

  return {
    dottedBackgroundStyle,
    radialGradientStyle,
  }
}
