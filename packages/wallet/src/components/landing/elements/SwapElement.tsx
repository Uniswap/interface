import { useMemo } from 'react'
import { Flex, Image, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { DAI_LOGO, ETH_LOGO } from 'ui/src/assets'
import { RightArrow } from 'ui/src/components/icons'
import { DEP_accentColors, imageSizes, validColor } from 'ui/src/theme'

export const SwapElement = (): JSX.Element => {
  const sporeColors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const colorPalette = useMemo(
    () =>
      isDarkMode
        ? {
            backgroundBase: validColor('#23283E'),
            textBase: validColor(DEP_accentColors.blue400),
            backgroundQuote: validColor('#40321A'),
            textQuote: validColor(DEP_accentColors.yellow200),
          }
        : {
            backgroundBase: validColor('#F1F4FF'),
            textBase: validColor(DEP_accentColors.blue400),
            backgroundQuote: validColor('#FFF9EC'),
            textQuote: validColor(DEP_accentColors.yellow200),
          },
    [isDarkMode],
  )

  return (
    <Flex centered row borderRadius="$rounded12" gap="$spacing4" p="$spacing12" transform={[{ rotateZ: '5deg' }]}>
      <Flex
        centered
        row
        backgroundColor={colorPalette.backgroundBase}
        borderRadius="$roundedFull"
        gap="$spacing8"
        p="$spacing8"
      >
        <Image height={imageSizes.image24} resizeMode="contain" source={ETH_LOGO} width={imageSizes.image24} />
        <Text color={colorPalette.textBase} textAlign="center" variant="body2">
          ETH
        </Text>
      </Flex>
      <RightArrow color={sporeColors.neutral3.val} size="$icon.20" />
      <Flex
        centered
        row
        backgroundColor={colorPalette.backgroundQuote}
        borderRadius="$roundedFull"
        gap="$spacing8"
        p="$spacing8"
      >
        <Image height={imageSizes.image24} resizeMode="contain" source={DAI_LOGO} width={imageSizes.image24} />
        <Text color={colorPalette.textQuote} textAlign="center" variant="body2">
          DAI
        </Text>
      </Flex>
    </Flex>
  )
}
