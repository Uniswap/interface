import React from 'react'
import { Flex, Image, PulseRipple, useSporeColors } from 'ui/src'

interface WalletIconWithRippleProps {
  src?: string
  alt?: string
  size?: number
  showRipple?: boolean
}

export function WalletIconWithRipple({
  src,
  alt,
  size = 48,
  showRipple = false,
}: WalletIconWithRippleProps): JSX.Element {
  const colors = useSporeColors()

  // Add small padding to account for ripple expansion
  // Ripple scales to 1.5x, so we need extra space of 0.25x on each side
  const margin = size * 0.25

  return (
    <Flex position="relative" width={size} height={size} style={{ margin }}>
      <Flex position="absolute" centered fill>
        <PulseRipple rippleColor={showRipple ? colors.accent1.val : 'transparent'} size={size} />
      </Flex>

      <Image src={src} alt={alt} width={size} height={size} borderRadius="$roundedFull" />
    </Flex>
  )
}
