import { useMemo } from 'react'
import { Flex, Image, Text, useIsDarkMode } from 'ui/src'
import { DAI_LOGO, ETH_LOGO } from 'ui/src/assets'
import { ArrowRight } from 'ui/src/components/icons'
import { DEP_accentColors, iconSizes, imageSizes, validColor } from 'ui/src/theme'

export const SwapElement = (): JSX.Element => {
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
    <Flex centered row borderRadius="$rounded12" gap="$spacing4" p="$spacing12" transform={[{ rotateZ: '8deg' }]}>
      <Flex
        centered
        row
        backgroundColor={colorPalette.backgroundBase}
        borderRadius="$roundedFull"
        $xs={{ gap: '$spacing4', p: '$spacing6', pr: '$spacing8' }}
        gap="$spacing8"
        p="$spacing8"
        pr="$spacing12"
      >
        <Image
          height={imageSizes.image24}
          $xs={{ height: imageSizes.image20, width: imageSizes.image20 }}
          resizeMode="contain"
          source={ETH_LOGO}
          width={imageSizes.image24}
        />
        <Text color={colorPalette.textBase} textAlign="center" variant="body2" $xs={{ variant: 'body3' }}>
          ETH
        </Text>
      </Flex>
      <ArrowRight color="$neutral3" size="$icon.20" $xs={{ size: iconSizes.icon16 }} />
      <Flex
        centered
        row
        backgroundColor={colorPalette.backgroundQuote}
        borderRadius="$roundedFull"
        $xs={{ gap: '$spacing4', p: '$spacing6', pr: '$spacing8' }}
        gap="$spacing8"
        p="$spacing8"
        pr="$spacing12"
      >
        <Image
          height={imageSizes.image24}
          $xs={{ height: imageSizes.image20, width: imageSizes.image20 }}
          resizeMode="contain"
          source={DAI_LOGO}
          width={imageSizes.image24}
        />
        <Text color={colorPalette.textQuote} textAlign="center" variant="body2" $xs={{ variant: 'body3' }}>
          DAI
        </Text>
      </Flex>
    </Flex>
  )
}
