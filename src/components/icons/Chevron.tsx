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
  width: string | number
  height: string | number
  direction: 'n' | 'e' | 's' | 'w'
  color?: string
} & BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

function _Chevron({ width, height, direction, color, ...rest }: Props) {
  let degree: string
  switch (direction) {
    case 'n':
      degree = '0deg'
      break
    case 'e':
      degree = '90deg'
      break
    case 's':
      degree = '180deg'
      break
    case 'w':
      degree = '270deg'
      break
    default:
      throw new Error(`Invalid chevron direction ${direction}`)
  }

  return (
    <CenterBox borderRadius="full" style={{ transform: [{ rotate: degree }] }} {...rest}>
      <Svg fill="none" height={height} viewBox="0 0 14 8" width={width}>
        <Path
          d="M13 7 7 1 1 7"
          stroke={color || '#000000'}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </Svg>
    </CenterBox>
  )
}

export const Chevron = memo(_Chevron)
