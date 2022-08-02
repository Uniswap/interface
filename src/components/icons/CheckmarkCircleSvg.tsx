import {
  BackgroundColorProps,
  BackgroundColorShorthandProps,
  SpacingProps,
  SpacingShorthandProps,
} from '@shopify/restyle'
import React, { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Theme } from 'src/styles/theme'

type Props = {
  width?: string | number
  height?: string | number
  stroke?: string
  fill?: string
} & BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

function _CheckCircle({ width = 16, height = 16, stroke, fill, ...rest }: Props) {
  return (
    <CenterBox borderRadius="full" {...rest}>
      <Svg fill="none" height={height} viewBox="0 0 16 16" width={width}>
        <Path
          d="M7.99968 14.6668C11.6816 14.6668 14.6663 11.6821 14.6663 8.00016C14.6663 4.31826 11.6816 1.3335 7.99968 1.3335C4.31778 1.3335 1.33301 4.31826 1.33301 8.00016C1.33301 11.6821 4.31778 14.6668 7.99968 14.6668Z"
          fill={fill || '#0E111A'}
          stroke={stroke || '#000000'}
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
        />
        <Path
          d="M10.6667 6.66667L7.00004 10L5.33337 8.48485"
          stroke={stroke || '#000000'}
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
        />
      </Svg>
    </CenterBox>
  )
}

export const CheckmarkCircleSvg = memo(_CheckCircle)
