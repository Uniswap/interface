import { Flex } from 'ui/src'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { GoogleChromeLogo } from 'ui/src/components/logos/GoogleChromeLogo'

interface UniswapBrandedIconProps {
  size?: number
  withChromeBadge?: boolean
}

export function UniswapBrandedIcon({ size = 32, withChromeBadge }: UniswapBrandedIconProps): JSX.Element {
  const badgeSize = Math.round(size * 0.375)
  const chromeLogoSize = badgeSize - 2
  return (
    <Flex
      position="relative"
      width={size}
      height={size}
      minWidth={size}
      alignItems="center"
      justifyContent="center"
      backgroundColor="$accent2"
      borderRadius="$rounded8"
    >
      <UniswapLogo color="$accent1" size={size * 0.7} />
      {withChromeBadge && (
        <Flex
          position="absolute"
          bottom={-Math.round(badgeSize * 0.25)}
          right={-Math.round(badgeSize / 3)}
          width={badgeSize}
          height={badgeSize}
          borderRadius="$roundedFull"
          backgroundColor="$surface2"
          alignItems="center"
          justifyContent="center"
        >
          <GoogleChromeLogo size={chromeLogoSize} />
        </Flex>
      )}
    </Flex>
  )
}
