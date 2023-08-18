import {
  BackgroundColorProps,
  BackgroundColorShorthandProps,
  SpacingProps,
  SpacingShorthandProps,
} from '@shopify/restyle'
import React, { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Theme } from 'ui/src/theme/restyle'

type Props = {
  width?: string | number
  height?: string | number
  direction?: 'n' | 'e' | 's' | 'w'
  color?: string
} & BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

function _Chevron({
  width = 24,
  height = 24,
  direction = 'w',
  color,
  ...rest
}: Props): JSX.Element {
  let degree: string
  switch (direction) {
    case 'n':
      degree = '90deg'
      break
    case 'e':
      degree = '180deg'
      break
    case 's':
      degree = '270deg'
      break
    case 'w':
      degree = '0deg'
      break
    default:
      throw new Error(`Invalid chevron direction ${direction}`)
  }

  return (
    <CenterBox borderRadius="roundedFull" style={{ transform: [{ rotate: degree }] }} {...rest}>
      <Svg fill="none" height={height} viewBox="0 0 26 24" width={width}>
        <Path
          d="M15 6L9 12L15 18"
          stroke={color || '#000000'}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
      </Svg>
    </CenterBox>
  )
}

export const Chevron = memo(_Chevron)
