import React, { memo } from 'react'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'

function _PinkToBlueLinear() {
  return (
    <Svg height="100%" width="100%" opacity={0.05}>
      <Defs>
        <LinearGradient id="background" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF007A" stopOpacity="1" />
          <Stop offset="1" stopColor="#426CFF" stopOpacity="0.3" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#background)" />
    </Svg>
  )
}

export const PinkToBlueLinear = memo(_PinkToBlueLinear)
