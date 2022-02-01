import { color as restyleColor, ColorProps, createRestyleComponent } from '@shopify/restyle'
import { SvgProps } from 'react-native-svg'
import SwapArrowSVG from 'src/assets/icons/swap-arrow.svg'
import { Theme } from 'src/styles/theme'

export const SwapArrow = createRestyleComponent<ColorProps<Theme> & Omit<SvgProps, 'color'>, Theme>(
  [restyleColor],
  SwapArrowSVG
)
