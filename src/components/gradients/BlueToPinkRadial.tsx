import React, { memo } from 'react'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'

function _BlueToPinkRadial() {
  return (
    // TODO still needs a bit more tweaking, bit too much blue
    <Svg height="100%" width="100%">
      <Defs>
        <RadialGradient id="background" rx="4" ry="1" cy="-0.1">
          <Stop offset="0" stopColor="#28A0F0" stopOpacity="1" />
          <Stop offset="1" stopColor="#FF007A" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="#F5F4F5" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#background)" opacity={0.2} />
    </Svg>
  )
}

export const BlueToPinkRadial = memo(_BlueToPinkRadial)
