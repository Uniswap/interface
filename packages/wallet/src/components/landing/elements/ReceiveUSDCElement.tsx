import { Flex, Image, Text, useIsDarkMode } from 'ui/src'
import { USDC_LOGO } from 'ui/src/assets'
import { colors, imageSizes, opacify } from 'ui/src/theme'

export const ReceiveUSDCElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      centered
      row
      borderRadius="$roundedFull"
      gap="$spacing8"
      opacity={isDarkMode ? 0.8 : 1}
      px="$spacing12"
      py="$spacing8"
      style={{ backgroundColor: opacify(20, colors.blue300) }}
      transform={[{ rotateZ: '-1deg' }]}
    >
      <Text color="$blue400" textAlign="center" variant="buttonLabel3">
        +100
      </Text>
      <Image height={imageSizes.image24} resizeMode="contain" source={USDC_LOGO} width={imageSizes.image24} />
    </Flex>
  )
}
