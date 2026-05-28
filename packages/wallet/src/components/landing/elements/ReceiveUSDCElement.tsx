import { Flex, Image, Text, useIsDarkMode } from 'ui/src'
import { USDC_LOGO } from 'ui/src/assets'
import { colors, imageSizes, opacify, validColor } from 'ui/src/theme'

// As we're using this color only in this component, we define it here instead in colors.ts
const BLUE_USDC_COLOR = '#2775CA'

export const ReceiveUSDCElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      centered
      row
      backgroundColor={isDarkMode ? opacify(15, colors.blueBase) : opacify(30, colors.bluePastel)}
      borderRadius="$roundedFull"
      gap="$spacing8"
      px="$spacing12"
      py="$spacing8"
      transform={[{ rotateZ: '-1deg' }]}
      $xs={{ px: '$spacing6', py: '$spacing6', gap: '$spacing4' }}
    >
      <Text
        color={validColor(BLUE_USDC_COLOR)}
        textAlign="center"
        variant="buttonLabel2"
        $xs={{ variant: 'buttonLabel3' }}
      >
        +100
      </Text>
      <Image
        height={imageSizes.image24}
        $xs={{ height: imageSizes.image20, width: imageSizes.image20 }}
        resizeMode="contain"
        source={USDC_LOGO}
        width={imageSizes.image24}
      />
    </Flex>
  )
}
