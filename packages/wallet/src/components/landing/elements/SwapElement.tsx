import { Flex, Image, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { DAI_LOGO, ETH_LOGO } from 'ui/src/assets'
import { RightArrow } from 'ui/src/components/icons'
import { DEP_accentColors, iconSizes, imageSizes, opacify, validColor } from 'ui/src/theme'

export const SwapElement = (): JSX.Element => {
  const sporeColors = useSporeColors()
  const isDarkMode = useIsDarkMode()

  const componentOpacity = isDarkMode ? 0.8 : 1
  const backgroundColorOpacity = isDarkMode ? 15 : 20

  return (
    <Flex centered row borderRadius="$rounded12" gap="$spacing4" p="$spacing12" transform={[{ rotateZ: '5deg' }]}>
      <Flex
        centered
        row
        backgroundColor={opacify(backgroundColorOpacity, DEP_accentColors.blue200)}
        borderRadius="$roundedFull"
        gap="$spacing8"
        opacity={componentOpacity}
        p="$spacing8"
      >
        <Image height={imageSizes.image24} resizeMode="contain" source={ETH_LOGO} width={imageSizes.image24} />
        <Text color={validColor(DEP_accentColors.blue400)} textAlign="center" variant="body2">
          ETH
        </Text>
      </Flex>
      <RightArrow color={sporeColors.neutral3.val} size={iconSizes.icon20} />
      <Flex
        centered
        row
        backgroundColor={opacify(backgroundColorOpacity, DEP_accentColors.yellow100)}
        borderRadius="$roundedFull"
        gap="$spacing8"
        opacity={componentOpacity}
        p="$spacing8"
      >
        <Image height={imageSizes.image24} resizeMode="contain" source={DAI_LOGO} width={imageSizes.image24} />
        <Text color={validColor(DEP_accentColors.yellow200)} textAlign="center" variant="body2">
          DAI
        </Text>
      </Flex>
    </Flex>
  )
}
