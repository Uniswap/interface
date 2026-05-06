import { CSSProperties, ReactNode } from 'react'
import { Flex } from 'ui/src'

interface TokenLaunchedBannerWrapperProps {
  bannerGradient: CSSProperties
  children: ReactNode
}

export function TokenLaunchedBannerWrapper({ bannerGradient, children }: TokenLaunchedBannerWrapperProps) {
  return (
    <Flex
      position="relative"
      overflow="hidden"
      borderRadius="$rounded12"
      width="100%"
      px="$spacing24"
      py="$spacing16"
      style={bannerGradient}
    >
      {children}
    </Flex>
  )
}
