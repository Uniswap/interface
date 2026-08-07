import { useState } from 'react'
import { Flex, Loader, UniversalImage, UniversalImageResizeMode, useColorSchemeFromSeed, useSporeColors } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { getBadgeBorderRadius } from 'uniswap/src/components/CurrencyLogo/badgeSizeUtils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

/**
 * Rounded-rect radius for a launchpad logo. Reuses the NetworkLogo squircle convention
 * (SQUIRCLE_BORDER_RADIUS_RATIO, size * 0.3) so launchpads and networks share the
 * non-circular treatment while circles stay reserved for assets.
 */
export function getLaunchpadLogoBorderRadius(size: number): number {
  return getBadgeBorderRadius(size, 'square')
}

/**
 * Launchpad registry logo. Deliberately NOT a TokenLogo: launchpads (like networks) render as
 * rounded rectangles, while circles are reserved for assets. Keeps TokenLogo's behavior
 * otherwise — a skeleton while loading, a seeded-color fallback when the registry has no logo,
 * and a white backing layer so transparent logos stay legible.
 */
export function LaunchpadLogo({
  url,
  name,
  size,
  loading = false,
}: {
  url?: string
  name?: string
  size: number
  loading?: boolean
}): JSX.Element {
  const colors = useSporeColors()
  const { background } = useColorSchemeFromSeed(name ?? '')
  const [showBackground, setShowBackground] = useState(false)
  const borderRadius = getLaunchpadLogoBorderRadius(size)

  if (loading) {
    return <Loader.Box borderRadius={borderRadius} height={size} width={size} />
  }

  const fallback = (
    <Flex borderRadius={borderRadius} height={size} width={size} style={{ backgroundColor: background }} />
  )

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      height={size}
      width={size}
      position="relative"
      testID={TestID.LaunchpadLogo}
    >
      <Flex
        opacity={showBackground ? 1 : 0}
        height="96%"
        width="96%"
        zIndex={zIndexes.background}
        backgroundColor={colors.white.val}
        position="absolute"
        top="2%"
        left="2%"
        borderRadius={borderRadius}
      />
      <UniversalImage
        allowLocalUri
        fallback={fallback}
        size={{ height: size, width: size, resizeMode: UniversalImageResizeMode.Cover }}
        style={{ image: { borderRadius, zIndex: zIndexes.default } }}
        testID={TestID.LaunchpadLogoImage}
        uri={url}
        onLoad={() => setShowBackground(true)}
      />
    </Flex>
  )
}
