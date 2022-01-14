import React, { memo } from 'react'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'

function _BlueToPinkRadial() {
  return (
    // TODO still needs a bit more tweaking, bit too much blue
    <Svg height="100%" width="100%">
      <Defs>
        <RadialGradient cy="-0.1" id="background" rx="4" ry="1">
          <Stop offset="0" stopColor="#28A0F0" stopOpacity="1" />
          <Stop offset="1" stopColor="#FF007A" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect fill="#F5F4F5" height="100%" width="100%" x="0" y="0" />
      <Rect fill="url(#background)" height="100%" opacity={0.2} width="100%" x="0" y="0" />
    </Svg>
  )
}

export const BlueToPinkRadial = memo(_BlueToPinkRadial)
