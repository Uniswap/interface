import React, { memo } from 'react'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'

function _PinkToBlueLinear() {
  return (
    <Svg height="100%" width="100%" opacity={0.1}>
      <Defs>
        <LinearGradient id="background" x1="0" y1="0" x2="1" y2="0.5">
          <Stop offset="0" stopColor="#FF007A" stopOpacity="1" />
          <Stop offset="1" stopColor="#426CFF" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#background)" />
    </Svg>
  )
}

export const PinkToBlueLinear = memo(_PinkToBlueLinear)
