import { Flex, Image, Text, useIsDarkMode } from 'ui/src'
import { USDC_LOGO } from 'ui/src/assets'
import { imageSizes, opacify, validColor } from 'ui/src/theme'

export const ReceiveUSDCElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      centered
      row
      backgroundColor={isDarkMode ? validColor('#15202B') : opacify(20, '#A7BAFF')}
      borderRadius="$roundedFull"
      gap="$spacing8"
      px="$spacing12"
      py="$spacing8"
      transform={[{ rotateZ: '-1deg' }]}
    >
      <Text color={validColor('#2775CA')} textAlign="center" variant="buttonLabel2">
        +100
      </Text>
      <Image height={imageSizes.image24} resizeMode="contain" source={USDC_LOGO} width={imageSizes.image24} />
    </Flex>
  )
}
