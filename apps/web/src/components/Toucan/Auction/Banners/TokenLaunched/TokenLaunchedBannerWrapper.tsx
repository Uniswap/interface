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
      borderRadius="$rounded24"
      width="100%"
      p="$spacing20"
      mb="$spacing28"
      $md={{ mb: '$spacing20' }}
      style={bannerGradient}
    >
      {children}
    </Flex>
  )
}
