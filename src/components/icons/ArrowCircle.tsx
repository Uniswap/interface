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
  direction?: 'n' | 'e' | 's' | 'w'
  stroke?: string
  fill?: string
} & BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

function _ArrowCircle({ width = 16, height = 16, direction = 's', stroke, fill, ...rest }: Props) {
  let degree: string
  switch (direction) {
    case 'n':
      degree = '180deg'
      break
    case 'e':
      degree = '270deg'
      break
    case 's':
      degree = '0deg'
      break
    case 'w':
      degree = '90deg'
      break
    default:
      throw new Error(`Invalid chevron direction ${direction}`)
  }

  return (
    <CenterBox borderRadius="full" style={{ transform: [{ rotate: degree }] }} {...rest}>
      <Svg fill="none" height={height} viewBox="0 0 16 16" width={width}>
        <Path
          d="M8.00004 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8.00003C14.6667 4.31813 11.6819 1.33337 8.00004 1.33337C4.31814 1.33337 1.33337 4.31813 1.33337 8.00003C1.33337 11.6819 4.31814 14.6667 8.00004 14.6667Z"
          fill={fill || '#0E111A'}
          stroke={stroke || '#000000'}
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
        />
        <Path
          d="M5.33337 8L8.00004 10.6667L10.6667 8"
          stroke={stroke || '#000000'}
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
        />
        <Path
          d="M8 5.33337V10.6667"
          stroke={stroke || '#000000'}
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
        />
      </Svg>
    </CenterBox>
  )
}

export const ArrowCircle = memo(_ArrowCircle)
